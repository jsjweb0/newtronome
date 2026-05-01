import fetch from "node-fetch";

export const handler = async (event) => {
    const url = event.queryStringParameters?.url;
    const clientId = process.env.SOUND_CLOUD_CLIENT_ID;

    if (!url) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Missing `url` query parameter" }),
        };
    }
    if (!clientId) {
        console.error("❌ SOUND_CLOUD_CLIENT_ID is not set");
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Server configuration error" }),
        };
    }

    try {
        const apiUrl = `https://api-v2.soundcloud.com/resolve?url=${encodeURIComponent(url)}&client_id=${clientId}`;
        const response = await fetch(apiUrl);
        const data = await response.json();

        return {
            statusCode: response.status,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            body: JSON.stringify(data),
        };
    } catch (err) {
        console.error("Resolve Error:", err);
        return {
            statusCode: 500,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ error: err.message }),
        };
    }
};
