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

import { ExtendedClient } from "./interfaces/ExtendedClient";
import { generateQuestionImage } from "./modules/generateQuestionImage";
import { twitterClient } from "./modules/twitterClient";
import { serve } from "./server/serve";

(async () => {
  const bot = new Client({
    intents: [GatewayIntentBits.Guilds],
  }) as ExtendedClient;
  const twitter = twitterClient();
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
      const messageId = interaction.customId.split("-")[1];
      const message = await bot.channel.messages.fetch(messageId);
      const question = message.embeds[0].description || "unknown";
      const answer = interaction.fields.getTextInputValue("answer");

      const oldEmbed = message.embeds[0];

      const questionImage = await generateQuestionImage(question);

      const media = await twitter.post("media/upload", {
        media: questionImage,
      });

      await twitter.post("statuses/update", {
        status: answer,
        media_ids: media.media_id_string,
      });

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
            name: "Answer",
            value: answer,
          },
        ]);
      await interaction.message?.edit({
        embeds: [newEmbed],
        components: [],
      });
    }

    if (interaction.isButton()) {
      if (interaction.customId === "respond") {
        if (interaction.user.id !== process.env.USER_ID) {
          await interaction.reply({
            content: "Only Naomi can answer these questions.",
            ephemeral: true,
          });
          return;
        }

        const imageUrl = interaction.message.attachments.first()?.url;
        const modal = new ModalBuilder()
          .setCustomId(`res-${interaction.message.id}`)
          .setTitle("Respond to this question!");

        const input = new TextInputBuilder()
          .setCustomId("answer")
          .setLabel("What is your answer?")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          // subtract an extra 2 characters for new lines.
          .setMaxLength(280 - (imageUrl?.length || 0) - 2);

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
