/* eslint-disable camelcase */
import {
  ActionRowBuilder,
  ChannelType,
  Client,
  EmbedBuilder,
  GatewayIntentBits,
  InteractionType,
  ModalActionRowComponentBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";

import { ImageFooters, ImageTitles } from "./interfaces/Enums";
import { ExtendedClient } from "./interfaces/ExtendedClient";
import { MediaResponse } from "./interfaces/MastodonResponses";
import { Category } from "./interfaces/Submission";
import { generateQuestionImage } from "./modules/generateQuestionImage";
import { serve } from "./server/serve";

(async () => {
  const bot = new Client({
    intents: [GatewayIntentBits.Guilds],
  }) as ExtendedClient;
  bot.token = process.env.BOT_TOKEN || process.exit(1);
  bot.ownerId = process.env.USER_ID || process.exit(1);

  bot.on("ready", async () => {
    const guild = await bot.guilds.fetch(process.env.HOME_GUILD || "");
    const channel = await guild.channels.fetch(
      process.env.QUESTION_CHANNEL || ""
    );
    if (!channel || channel.type !== ChannelType.GuildText) {
      console.error("Channel not found or not a text channel.");
      process.exit(1);
    }
    // eslint-disable-next-line require-atomic-updates
    bot.channel = channel;
    console.log("Bot is ready!");
  });

  bot.on("interactionCreate", async (interaction) => {
    if (interaction.type === InteractionType.ModalSubmit) {
      await interaction.deferUpdate();
      const [messageId, category] = interaction.customId.split("-") as [
        string,
        Category
      ];

      const message = await bot.channel.messages.fetch(messageId);
      const question = message.embeds[0].description || "unknown";
      const answer = interaction.fields.getTextInputValue("answer");

      const oldEmbed = message.embeds[0];

      const questionImage = await generateQuestionImage(question, category);

      const form = new FormData();
      form.append("file", new Blob([questionImage]), "question.png");
      form.append(
        "description",
        `${ImageTitles[category]}\n\nAnswer:\n${answer}\n\n${ImageFooters[category]}`
      );

      const rawMedia = await fetch("https://mastodon.naomi.lgbt/api/v2/media", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.MASTODON_AUTH_TOKEN}`,
        },
        body: form,
      }).catch((err) => {
        console.log("Media failed.");
        console.error(err);
        process.exit(1);
      });

      const media = (await rawMedia.json()) as MediaResponse;

      console.log(JSON.stringify(media, null, 2));

      const rawPost = await fetch(
        `https://mastodon.naomi.lgbt/api/v1/statuses`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.MASTODON_AUTH_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: answer,
            media_ids: [media.id],
          }),
        }
      ).catch((err) => {
        console.log("Post failed.");
        console.error(err);
        process.exit(1);
      });

      const post = await rawPost.json();

      console.log(JSON.stringify(post, null, 2));

      const newEmbed = new EmbedBuilder()
        .setTitle(oldEmbed.title || "Answered Question!")
        .setDescription(
          oldEmbed.description ||
            "Something went wrong and the question was lost."
        )
        .addFields([
          {
            name: oldEmbed.fields?.[0].name || "Asked By",
            value: oldEmbed.fields?.[0].value || "Anonymous",
          },
          {
            name: "Response",
            value: answer,
          },
        ]);
      await interaction.message?.edit({
        embeds: [newEmbed],
        components: [],
      });
    }

    if (interaction.isButton()) {
      if (interaction.customId.startsWith("respond")) {
        if (interaction.user.id !== process.env.USER_ID) {
          await interaction.reply({
            content: "Only Naomi can answer these questions.",
            ephemeral: true,
          });
          return;
        }
        const category = interaction.customId.split("-")[1] as Category;
        const modalId = `${interaction.message.id}-${category}`;
        const modal = new ModalBuilder()
          .setCustomId(modalId)
          .setTitle("Enter Your Response");

        const input = new TextInputBuilder()
          .setCustomId("answer")
          .setLabel("What is your answer?")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          // subtract an extra 2 characters for new lines.
          .setMaxLength(280);

        const row =
          new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
            input
          );
        modal.addComponents(row);

        await interaction.showModal(modal);
      }
    }
  });

  await serve(bot);

  await bot.login(process.env.BOT_TOKEN);
})();
