import { readFile } from "fs/promises";
import http from "http";
import https from "https";

import cors from "cors";
import express from "express";
import fetch from "node-fetch";

(async () => {
  const HTTPEndpoint = express();
  HTTPEndpoint.disable("x-powered-by");
  HTTPEndpoint.use(express.json());
  const allowedOrigins = ["https://anon.naomi.lgbt"];

  HTTPEndpoint.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
    })
  );

  HTTPEndpoint.post("/ask", async (req, res) => {
    const { question, user } = req.body;

    if (!question) {
      res.status(400).send({ message: "No question provided." });
    }

    await fetch(process.env.WEBHOOK_URL as string, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        embeds: [
          {
            title: "New Question",
            description: question,
            fields: [
              {
                name: "Author",
                value: user || "Anonymous",
              },
            ],
          },
        ],
      }),
    });

    res.status(200).json({ message: "Your question has been recieved!" });
  });

  const httpServer = http.createServer(HTTPEndpoint);

  httpServer.listen(6080, () => {
    console.log("HTTP server running on port 6080");
  });

  if (process.env.NODE_ENV === "production") {
    const privateKey = await readFile(
      "/etc/letsencrypt/live/anon-api.naomi.lgbt/privkey.pem",
      "utf8"
    );
    const certificate = await readFile(
      "/etc/letsencrypt/live/anon-api.naomi.lgbt/cert.pem",
      "utf8"
    );
    const ca = await readFile(
      "/etc/letsencrypt/live/anon-api.naomi.lgbt/chain.pem",
      "utf8"
    );

    const credentials = {
      key: privateKey,
      cert: certificate,
      ca: ca,
    };

    const httpsServer = https.createServer(credentials, HTTPEndpoint);
    httpsServer.listen(6443, () => {
      console.log("https server is live on port 6443");
    });
  }
})();
