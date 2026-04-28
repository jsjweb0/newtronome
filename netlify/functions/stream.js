const fetch = require("node-fetch");

exports.handler = async (event) => {
    const { path } = event.queryStringParameters || {};
    const clientId = process.env.SOUND_CLOUD_CLIENT_ID;

    if (!path) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Missing `path` query parameter" }),
        };
    }

    if (!clientId) {
           console.error("❌ SOUND_CLOUD_CLIENT_ID is not set");
           return { statusCode: 500, body: JSON.stringify({ error: "Server configuration error" }) };
         }
    const url = `https://api-v2.soundcloud.com${path}?client_id=${clientId}`;

    try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        return {
            statusCode: 200,
            headers: {
                "Content-Type": response.headers.get("content-type"),
                "Access-Control-Allow-Origin": "*"
            },
            body: Buffer.from(arrayBuffer).toString("base64"),
            isBase64Encoded: true,
        };
    } catch (err) {
        console.error("Stream Error:", err);
        return {
            statusCode: 500,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ error: err.message }),
        };
    }
};