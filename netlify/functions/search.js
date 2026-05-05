import fetch from "node-fetch";

/* global process */

export const handler = async (event) => {
    const query = event.queryStringParameters?.q;
    const clientId = process.env.SOUND_CLOUD_CLIENT_ID;

    if (!query) {
        return { statusCode: 400, body: JSON.stringify({ error: "Missing `q` parameter" }) };
    }
    if (!clientId) {
        console.error("❌ SOUND_CLOUD_CLIENT_ID is not set");
        return { statusCode: 500, body: JSON.stringify({ error: "Server config error" }) };
    }

    try {
        // SoundCloud 검색 API 호출
        const apiUrl = `https://api-v2.soundcloud.com/search/tracks?q=${encodeURIComponent(query)}&client_id=${clientId}`;
        const res = await fetch(apiUrl);
        const data = await res.json();

        return {
            statusCode: res.status,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Cache-Control": "public, max-age=3600, s-maxage=86400",
            },
            body: JSON.stringify(data),
        };
    } catch (err) {
        console.error("Search Error:", err);
        return { statusCode: 500, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ error: err.message }) };
    }
};
