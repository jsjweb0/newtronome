import { useState, useCallback } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

export default function useSoundCloudApi() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // 1) Resolve any SoundCloud URL via Netlify function
    const resolveUrl = useCallback(async (url) => {
        const res = await fetch(`${API_BASE}/resolve?url=${encodeURIComponent(url)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
    }, []);

    // 2) Fetch audio stream JSON and return direct MP3 URL
    const getStreamUrl = useCallback(async (path) => {
        const res = await fetch(`${API_BASE}/stream?path=${encodeURIComponent(path)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const { url } = await res.json();
        if (!url) throw new Error("Invalid stream response");
        return url;
    }, []);

    // 3) Get playlist tracks from public playlist URL
    const getPlaylistByUrl = useCallback(
        async (playlistUrl) => {
            setLoading(true);
            setError(null);
            try {
                const playlist = await resolveUrl(playlistUrl);
                const tracksList = Array.isArray(playlist.tracks) ? playlist.tracks : [];

                const mapped = await Promise.all(
                    tracksList.map(async (track) => {
                        let mp3Url = "";
                        const media = track.media;
                        if (media?.transcodings) {
                            const prog = media.transcodings.find(
                                (t) => t.format.protocol === "progressive"
                            );
                            if (prog) {
                                const path = new URL(prog.url).pathname;
                                mp3Url = await getStreamUrl(path);
                            }
                        }
                        if (!mp3Url && track.stream_url) {
                            const path = new URL(track.stream_url).pathname;
                            mp3Url = await getStreamUrl(path);
                        }
                        if (!mp3Url) return null;
                        return {
                            id: track.id,
                            title: track.title,
                            artist: track.user?.username || "",
                            artwork: track.artwork_url,
                            mp3Url,
                            duration: track.duration,
                            playback_count: track.playback_count ?? 0,
                            favoritings_count: track.favoritings_count ?? 0,
                            genre: track.genre || "",
                            release: track.release || "",
                            tag_list: track.tag_list || "",
                            release_year: track.release_year,
                            release_month: track.release_month,
                            release_day: track.release_day,
                        };
                    })
                );
                return mapped.filter(Boolean);
            } catch (err) {
                console.error(`getPlaylistByUrl failed: ${playlistUrl}`, err);
                setError(err);
                return [];
            } finally {
                setLoading(false);
            }
        },
        [resolveUrl, getStreamUrl]
    );

    // 4) Convenience: fetch multiple playlists at once
    const getPlaylistsByUrls = useCallback(
        async (urls) => {
            setLoading(true);
            setError(null);
            try {
                const lists = await Promise.all(urls.map((url) => getPlaylistByUrl(url)));
                return lists.flat();
            } catch (err) {
                console.error("getPlaylistsByUrls failed", err);
                setError(err);
                return [];
            } finally {
                setLoading(false);
            }
        },
        [getPlaylistByUrl]
    );

    // 5) Search tracks by query via Netlify function
    const searchTracks = useCallback(async (query) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(
                `${API_BASE}/search?q=${encodeURIComponent(query)}`
            );
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            return Array.isArray(data.collection) ? data.collection : [];
        } catch (err) {
            console.error(`searchTracks failed: ${query}`, err);
            setError(err);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    // 6) Search tracks and include stream URLs
    const searchTracksWithDetails = useCallback(
        async (query) => {
            setLoading(true);
            setError(null);
            try {
                const raw = await searchTracks(query);
                const detailed = await Promise.all(
                    raw.map(async (track) => {
                        let mp3Url = "";
                        const media = track.media;
                        if (media?.transcodings) {
                            const prog = media.transcodings.find(
                                (t) => t.format.protocol === "progressive"
                            );
                            if (prog) {
                                const path = new URL(prog.url).pathname;
                                mp3Url = await getStreamUrl(path);
                            }
                        }
                        if (!mp3Url && track.stream_url) {
                            const path = new URL(track.stream_url).pathname;
                            mp3Url = await getStreamUrl(path);
                        }
                        if (!mp3Url) return null;
                        return {
                            id: track.id,
                            title: track.title,
                            artist: track.user?.username || "",
                            artwork: track.artwork_url,
                            mp3Url,
                            duration: track.duration,
                            playback_count: track.playback_count ?? 0,
                            favoritings_count: track.favoritings_count ?? 0,
                            genre: track.genre || "",
                            release: track.release || "",
                            tag_list: track.tag_list || "",
                            release_year: track.release_year,
                            release_month: track.release_month,
                            release_day: track.release_day,
                        };
                    })
                );
                return detailed.filter(Boolean);
            } catch (err) {
                console.error(`searchTracksWithDetails failed: ${query}`, err);
                setError(err);
                return [];
            } finally {
                setLoading(false);
            }
        },
        [searchTracks, getStreamUrl]
    );

    async function getTrackById(id) {
        const res = await fetch(`${API_BASE}/resolve?url=${encodeURIComponent(id)}`);
        if (!res.ok) throw new Error("SC track fetch failed");
        return res.json();
    }



    return {
        loading,
        error,
        getPlaylistByUrl,
        getPlaylistsByUrls,
        searchTracks,
        searchTracksWithDetails,
        getStreamUrl,
        getTrackById
    };
}
