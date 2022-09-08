/* eslint-disable camelcase */
import Twitter from "twitter";

/**
 * Generates a twitter client!
 *
 * @returns {Twitter} A twitter client.
 */
export const twitterClient = (): Twitter => {
  const consumerKey = process.env.CONSUMER_KEY;
  const consumerSecret = process.env.CONSUMER_SECRET;
  const accessToken = process.env.ACCESS_TOKEN;
  const accessSecret = process.env.ACCESS_SECRET;
  if (!consumerKey || !consumerSecret || !accessToken || !accessSecret) {
    console.error("Missing API values!");
    process.exit(1);
  }

  const twitterClient = new Twitter({
    consumer_key: consumerKey,
    consumer_secret: consumerSecret,
    access_token_key: accessToken,
    access_token_secret: accessSecret,
  });

  return twitterClient;
};
