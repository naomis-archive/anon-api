import { Client, TextChannel } from "discord.js";

export interface ExtendedClient extends Client {
  token: string;
  ownerId: string;
  channel: TextChannel;
}
