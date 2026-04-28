/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { setGlobalOptions } = require("firebase-functions");
const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

setGlobalOptions({ maxInstances: 10 });

const app = express();
app.use(cors());

// ✅ 사운드클라우드 mp3 프록시
app.get("/stream", async (req, res) => {
    const { path, client_id } = req.query;

    if (!path || !client_id) {
        return res.status(400).json({ error: "Missing path or client_id" });
    }

    try {
        const url = `https://api-v2.soundcloud.com${path}?client_id=${client_id}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data?.url) {
            res.json({ url: data.url });
        } else {
            res.status(500).json({ error: "No stream URL returned" });
        }
    } catch (err) {
        logger.error("Proxy error", err);
        res.status(500).json({ error: "Proxy failed" });
    }
});

// ✅ 이 부분이 핵심: Express 라우터를 Firebase Function에 연결
exports.api = onRequest(app);
