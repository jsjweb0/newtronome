import { useState, useCallback } from "react";

const API_BASE = "/api";
const clientId = import.meta.env.VITE_SOUNDCLOUD_CLIENT_ID;

export default function useSoundCloudApi() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const resolveUrl = useCallback(async (url) => {
        const res = await fetch(`/api/resolve?url=${encodeURIComponent(url)}&client_id=${clientId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
    }, []);

    const getTrackDetails = useCallback(async (trackId) => {
        const res = await fetch(`${API_BASE}/tracks/${trackId}?client_id=${clientId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
    }, []);

    const getPlaylistByUrl = useCallback(async (playlistUrl) => {
        setLoading(true);
        setError(null);
        try {
            const preview = await resolveUrl(playlistUrl);
            const plRes = await fetch(`${API_BASE}/playlists/${preview.id}?client_id=${clientId}`);
            if (!plRes.ok) throw new Error(`HTTP ${plRes.status}`);
            const playlist = await plRes.json();
            const tracksList = Array.isArray(playlist.tracks) ? playlist.tracks : [];

            const mapped = await Promise.all(
                tracksList.map(async (track) => {
                    let mp3Url = "";
                    let streamJsonPath = "";

                    const media = track.media;
                    if (media?.transcodings) {
                        const prog = media.transcodings.find(t => t.format.protocol === "progressive");
                        if (prog) {
                            const path = new URL(prog.url).pathname;
                            streamJsonPath = `/api${path}?client_id=${clientId}`;
                            try {
                                const jsonRes = await fetch(streamJsonPath);
                                const { url } = await jsonRes.json();
                                mp3Url = url;
                            } catch (e) {
                                console.error(`mp3Url 해상 실패: ${track.id}`, e);
                            }
                        }
                    }

                    if (!mp3Url && track.stream_url) {
                        streamJsonPath = `${track.stream_url}?client_id=${clientId}`;
                        mp3Url = streamJsonPath;
                    }

                    if (!mp3Url) return null;
                    return {
                        id: track.id,
                        title: track.title,
                        artist: track.user?.username || "",
                        artwork: track.artwork_url,
                        mp3Url,
                        streamJsonPath,
                    };
                })
            );

            return mapped.filter(Boolean);
        } catch (err) {
            console.error(`getPlaylistByUrl 실패: ${playlistUrl}`, err);
            return [];
        } finally {
            setLoading(false);
        }
    }, [resolveUrl]);

    const searchTracks = useCallback(async (q, limit = 20) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(
                `${API_BASE}/search/tracks?q=${encodeURIComponent(q)}&client_id=${clientId}&limit=${limit}`
            );
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();

            const mapped = await Promise.all(
                data.collection.map(async (item) => {
                    if (item.media?.transcodings) {
                        const tr = item.media.transcodings.find(x => x.format.protocol === "progressive");
                        if (tr) {
                            const path = new URL(tr.url).pathname;
                            const jsonRes = await fetch(`/api${path}?client_id=${clientId}`);
                            const { url: mp3Url } = await jsonRes.json();
                            return {
                                id: item.id,
                                title: item.title,
                                artist: item.user.username,
                                artwork: item.artwork_url,
                                mp3Url,
                                streamJsonPath: `/api${path}?client_id=${clientId}`,
                            };
                        }
                    }

                    if (item.stream_url) {
                        const mp3Url = `${item.stream_url}?client_id=${clientId}`;
                        return {
                            id: item.id,
                            title: item.title,
                            artist: item.user.username,
                            artwork: item.artwork_url,
                            mp3Url,
                            streamJsonPath: mp3Url,
                        };
                    }

                    return null;
                })
            );

            return mapped.filter(Boolean);
        } catch (err) {
            setError(err);
            console.error("searchTracks 에러", err);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const searchTracksWithDetails = useCallback(async (q, limit = 20) => {
        setLoading(true);
        setError(null);
        try {
            const basic = await searchTracks(q, limit);
            const detailed = await Promise.all(
                basic.map(async (t) => {
                    const d = await getTrackDetails(t.id);
                    return {
                        ...t,
                        duration: d.duration ?? 0,
                        genre: d.genre || "",
                        release: d.release || "",
                        playback_count: d.playback_count ?? 0,
                        favoritings_count: d.favoritings_count ?? 0,
                        tag_list: d.tag_list || "",
                        release_year: d.release_year,
                        release_month: d.release_month,
                        release_day: d.release_day,
                    };
                })
            );
            return detailed;
        } catch (err) {
            setError(err);
            console.error("searchTracksWithDetails 에러", err);
            return [];
        } finally {
            setLoading(false);
        }
    }, [searchTracks, getTrackDetails]);

    const getPlaylistsByUrls = useCallback(async (urls = []) => {
        setLoading(true);
        setError(null);
        try {
            const basicLists = await Promise.all(
                urls.map(url =>
                    getPlaylistByUrl(url).catch(err => {
                        console.error(`플레이리스트 로드 실패: ${url}`, err);
                        return [];
                    })
                )
            );

            const flat = basicLists.flat().filter(Boolean);

            const detailed = await Promise.all(
                flat.map(async t => {
                    try {
                        const d = await getTrackDetails(t.id);
                        let streamJsonPath = t.streamJsonPath;
                        let mp3Url = t.mp3Url || "";

                        if (d.media?.transcodings) {
                            const prog = d.media.transcodings.find(x => x.format.protocol === "progressive");
                            if (prog) {
                                const path = new URL(prog.url).pathname;
                                streamJsonPath = `/api${path}?client_id=${clientId}`;
                                const jsonRes = await fetch(streamJsonPath);
                                const { url } = await jsonRes.json();
                                mp3Url = url;
                            }
                        } else if (d.stream_url) {
                            streamJsonPath = `${d.stream_url}?client_id=${clientId}`;
                            mp3Url = streamJsonPath;
                        }

                        return {
                            ...t,
                            mp3Url,
                            streamJsonPath,
                            duration: d.duration ?? 0,
                            playback_count: d.playback_count ?? 0,
                            favoritings_count: d.favoritings_count ?? 0,
                            genre: d.genre || "",
                            release: d.release || "",
                            tag_list: d.tag_list || "",
                            release_year: d.release_year,
                            release_month: d.release_month,
                            release_day: d.release_day,
                        };
                    } catch (e) {
                        console.error(`트랙 상세 정보 fetch 실패: ${t.id}`, e);
                        return t;
                    }
                })
            );
            return detailed;
        } catch (err) {
            setError(err);
            console.error("getPlaylistsByUrls 에러", err);
            return [];
        } finally {
            setLoading(false);
        }
    }, [getPlaylistByUrl, getTrackDetails]);

    return {
        loading,
        error,
        searchTracks,
        searchTracksWithDetails,
        getPlaylistByUrl,
        getPlaylistsByUrls,
        getTrackDetails,
    };
}
