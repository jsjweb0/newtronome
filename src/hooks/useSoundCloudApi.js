import { useState, useCallback } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";
const CACHE_PREFIX = "newtronome:soundcloud:";
const CACHE_TTL = 1000 * 60 * 60 * 24;
const SEARCH_LIMIT = 20;
const PLAYLIST_TRACK_LIMIT = 12;

const getCachedJson = (key) => {
    if (typeof window === "undefined") return null;

    try {
        const cached = window.localStorage.getItem(`${CACHE_PREFIX}${key}`);
        if (!cached) return null;

        const { expiresAt, data } = JSON.parse(cached);
        if (Date.now() > expiresAt) {
            window.localStorage.removeItem(`${CACHE_PREFIX}${key}`);
            return null;
        }

        return data;
    } catch {
        return null;
    }
};

const setCachedJson = (key, data) => {
    if (typeof window === "undefined") return;

    try {
        window.localStorage.setItem(
            `${CACHE_PREFIX}${key}`,
            JSON.stringify({
                data,
                expiresAt: Date.now() + CACHE_TTL,
            })
        );
    } catch {
        // Storage can be unavailable in private mode or full storage.
    }
};

const getStreamPath = (track) => {
    const progressive = track.media?.transcodings?.find(
        (transcoding) => transcoding.format.protocol === "progressive"
    );

    if (progressive?.url) return new URL(progressive.url).pathname;
    if (track.stream_url) return new URL(track.stream_url).pathname;

    return "";
};

const mapTrack = (track, mp3Url) => ({
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
});

export default function useSoundCloudApi() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // 1) Resolve any SoundCloud URL via Netlify function
    const resolveUrl = useCallback(async (url) => {
        const cacheKey = `resolve:${url}`;
        const cached = getCachedJson(cacheKey);
        if (cached) return cached;

        const res = await fetch(`${API_BASE}/resolve?url=${encodeURIComponent(url)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setCachedJson(cacheKey, data);
        return data;
    }, []);

    // 2) Fetch audio stream JSON and return direct MP3 URL
    const getStreamUrl = useCallback(async (path) => {
        const cacheKey = `stream:${path}`;
        const cached = getCachedJson(cacheKey);
        if (cached) return cached;

        const res = await fetch(`${API_BASE}/stream?path=${encodeURIComponent(path)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const { url } = await res.json();
        if (!url) throw new Error("Invalid stream response");
        setCachedJson(cacheKey, url);
        return url;
    }, []);

    // 3) Get playlist tracks from public playlist URL
    const getPlaylistByUrl = useCallback(
        async (playlistUrl) => {
            setLoading(true);
            setError(null);
            try {
                const playlist = await resolveUrl(playlistUrl);
                const tracksList = Array.isArray(playlist.tracks)
                    ? playlist.tracks.slice(0, PLAYLIST_TRACK_LIMIT)
                    : [];

                const mapped = await Promise.all(
                    tracksList.map(async (track) => {
                        const streamPath = getStreamPath(track);
                        const mp3Url = streamPath ? await getStreamUrl(streamPath) : "";
                        if (!mp3Url) return null;

                        return mapTrack(track, mp3Url);
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
            const cacheKey = `search:${query}`;
            const cached = getCachedJson(cacheKey);
            if (cached) return cached;

            const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            const collection = Array.isArray(data.collection)
                ? data.collection.slice(0, SEARCH_LIMIT)
                : [];
            setCachedJson(cacheKey, collection);
            return collection;
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
                        const streamPath = getStreamPath(track);
                        const mp3Url = streamPath ? await getStreamUrl(streamPath) : "";
                        if (!mp3Url) return null;

                        return mapTrack(track, mp3Url);
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
