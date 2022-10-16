/* eslint-disable camelcase */
import { TwitterApi } from "twitter-api-v2";

/**
 * Generates a twitter client!
 *
 * @returns {TwitterApi} A twitter client.
 */
export const twitterClient = (): TwitterApi => {
  const consumerKey = process.env.CONSUMER_KEY;
  const consumerSecret = process.env.CONSUMER_SECRET;
  const accessToken = process.env.ACCESS_TOKEN;
  const accessSecret = process.env.ACCESS_SECRET;
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
