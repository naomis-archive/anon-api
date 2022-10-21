/* eslint-disable camelcase */
import { TwitterApi } from "twitter-api-v2";

/**
 * Generates a twitter client!
 *
 * @param { boolean } nsfw Whether to use the NSFW twitter account.
 * @returns {TwitterApi} A twitter client.
 */
export const twitterClient = (nsfw = false): TwitterApi => {
  const consumerKey = nsfw
    ? process.env.NSFW_CONSUMER_KEY
    : process.env.CONSUMER_KEY;
  const consumerSecret = nsfw
    ? process.env.NSFW_CONSUMER_SECRET
    : process.env.CONSUMER_SECRET;
  const accessToken = nsfw
    ? process.env.NSFW_ACCESS_TOKEN
    : process.env.ACCESS_TOKEN;
  const accessSecret = nsfw
    ? process.env.NSFW_ACCESS_TOKEN_SECRET
    : process.env.ACCESS_TOKEN_SECRET;
  if (!consumerKey || !consumerSecret || !accessToken || !accessSecret) {
    console.error("Missing API values!");
    process.exit(1);
  }

  const twitterClient = new TwitterApi({
    appKey: consumerKey,
    appSecret: consumerSecret,
    accessToken,
    accessSecret,
  });

  return twitterClient;
};
