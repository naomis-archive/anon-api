import {
  ActionRowBuilder,
  AttachmentBuilder,
  ChannelType,
  Client,
  GatewayIntentBits,
  InteractionType,
  ModalActionRowComponentBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";

import { ImageFooters, ImageTitles } from "./interfaces/Enums";
import { ExtendedClient } from "./interfaces/ExtendedClient";
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
    if (bot.channel !== channel) {
      bot.channel = channel;
    }
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

      const questionImage = await generateQuestionImage(question, category);

      const attachment = new AttachmentBuilder(questionImage, {
        name: "question.png",
        description: `Category: ${ImageTitles[category]}\n\nSubmission: ${question}\n\nFooter: ${ImageFooters[category]}`,
      });

      await interaction.message?.edit({
        content: answer,
        embeds: [],
        files: [attachment],
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
