import { readFile } from "fs/promises";
import http from "http";
import https from "https";

import cors from "cors";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";
import express from "express";

import {
  SubmissionButtonEmotes,
  SubmissionButtonTitles,
  SubmissionTitles,
} from "../interfaces/Enums";
import { ExtendedClient } from "../interfaces/ExtendedClient";
import { Submission } from "../interfaces/Submission";

/**
 * Module to start the webserver.
 *
 * @param {ExtendedClient} bot The bot client.
 */
export const serve = async (bot: ExtendedClient) => {
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
    const { question, user, category } = req.body as Submission;

    if (!question) {
      res.status(400).send({ message: "No question provided." });
      return;
    }

    const trimmedQuestion = question.replace(/\n{2,}/g, "\n");

    const embed = new EmbedBuilder()
      .setTitle(SubmissionTitles[category])
      .setDescription(trimmedQuestion)
      .addFields([{ name: "Asked by", value: user, inline: true }]);

    const button = new ButtonBuilder()
      .setCustomId(`respond-${category}`)
      .setLabel(SubmissionButtonTitles[category])
      .setStyle(ButtonStyle.Success)
      .setEmoji(SubmissionButtonEmotes[category]);
    const nsfwButton = new ButtonBuilder()
      .setCustomId(`respondnsfw-${category}`)
      .setLabel(SubmissionButtonTitles[category])
      .setStyle(ButtonStyle.Success)
      .setEmoji(SubmissionButtonEmotes.nsfw);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      button,
      nsfwButton
    );

    await bot.channel.send({
      embeds: [embed],
      components: [row],
    });

    res.status(200).json({ message: "Your question has been received!" });
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
};
