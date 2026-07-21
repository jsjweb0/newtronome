const SOUND_CLOUD_API_BASE = "https://api-v2.soundcloud.com";

const jsonHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};

const cachedHeaders = {
    ...jsonHeaders,
    "Cache-Control": "public, max-age=3600, s-maxage=86400",
};

const createJsonResponse = (body, status = 200, headers = jsonHeaders) =>
    new Response(JSON.stringify(body), {
        status,
        headers,
    });

const getClientId = (env) => env.SOUND_CLOUD_CLIENT_ID;

const createSoundCloudUrl = (pathname, clientId, params = {}) => {
    const url = new URL(pathname, SOUND_CLOUD_API_BASE);

    Object.entries(params).forEach(([key, value]) => {
        if (value) url.searchParams.set(key, value);
    });

    url.searchParams.set("client_id", clientId);
    return url;
};

const fetchJson = async (url) => {
    const response = await fetch(url);
    const data = await response.json();

    return createJsonResponse(data, response.status, cachedHeaders);
};

const getTrackCollection = (value) => {
    if (Array.isArray(value)) return value;
    if (value && Array.isArray(value.collection)) return value.collection;
    return [];
};

const hydratePlaylistTracks = async (playlist, clientId) => {
    if (!playlist || !Array.isArray(playlist.tracks)) return playlist;

    const partialTrackIds = playlist.tracks
        .filter((track) => track?.id && !track.title)
        .map((track) => track.id);

    if (partialTrackIds.length === 0) return playlist;

    const tracksUrl = createSoundCloudUrl("/tracks", clientId, {
        ids: partialTrackIds.join(","),
    });
    const response = await fetch(tracksUrl);
    if (!response.ok) return playlist;

    const trackDetails = getTrackCollection(await response.json());
    const detailsById = new Map(trackDetails.map((track) => [String(track.id), track]));

    return {
        ...playlist,
        tracks: playlist.tracks.map((track) => detailsById.get(String(track.id)) ?? track),
    };
};

const handleSearch = async (request, clientId) => {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query) {
        return createJsonResponse({ error: "Missing `q` parameter" }, 400);
    }

    const url = createSoundCloudUrl("/search/tracks", clientId, { q: query });
    return fetchJson(url);
};

const handleResolve = async (request, clientId) => {
    const { searchParams } = new URL(request.url);
    const soundCloudUrl = searchParams.get("url");

    if (!soundCloudUrl) {
        return createJsonResponse({ error: "Missing `url` query parameter" }, 400);
    }

    const url = createSoundCloudUrl("/resolve", clientId, { url: soundCloudUrl });
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
        return createJsonResponse(data, response.status, cachedHeaders);
    }

    const hydratedData = await hydratePlaylistTracks(data, clientId);
    return createJsonResponse(hydratedData, response.status, cachedHeaders);
};

const handleStream = async (request, clientId) => {
    const { searchParams } = new URL(request.url);
    const streamPath = searchParams.get("path");
    const trackAuthorization = searchParams.get("track_authorization");

    if (!streamPath) {
        return createJsonResponse({ error: "Missing `path` query parameter" }, 400);
    }

    if (!streamPath.startsWith("/") || streamPath.startsWith("//")) {
        return createJsonResponse({ error: "Invalid `path` query parameter" }, 400);
    }

    const url = createSoundCloudUrl(streamPath, clientId, {
        track_authorization: trackAuthorization,
    });
    return fetchJson(url);
};

export default {
    async fetch(request, env) {
        if (request.method === "OPTIONS") {
            return new Response(null, { status: 204, headers: jsonHeaders });
        }

        if (request.method !== "GET") {
            return createJsonResponse({ error: "Method not allowed" }, 405);
        }

        const clientId = getClientId(env);

        if (!clientId) {
            return createJsonResponse({ error: "Server configuration error" }, 500);
        }

        const { pathname } = new URL(request.url);
        const route = pathname.replace(/^\/api/, "");

        try {
            if (route === "/search") return handleSearch(request, clientId);
            if (route === "/resolve") return handleResolve(request, clientId);
            if (route === "/stream") return handleStream(request, clientId);

            return createJsonResponse({ error: "Not found" }, 404);
        } catch (error) {
            return createJsonResponse({ error: error.message }, 500);
        }
    },
};
