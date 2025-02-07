const Redis = require("ioredis");
const logger = require("../utils/logger");

function redisConnect() {
  const redisClient = new Redis(process.env.REDIS_URI);
  redisClient.on("connect", () => {
    logger.info("Connected to Redis");
  });
  redisClient.on("error", (err) => {
    logger.error("Could not connect to Redis", err);
  });
  return redisClient;
}

module.exports = redisConnect;
