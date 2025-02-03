const { RateLimiterRedis } = require("rate-limiter-flexible");
const logger = require("../utils/logger");
const connectRedis = require("../config/redis");
const { RedisStore } = require("rate-limit-redis");
const { rateLimit } = require("express-rate-limit");

const redisClient = connectRedis();

const RedisClientMiddleware = (req, res, next) => {
  req.redisClient = redisClient;
  next();
};

const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "middleware",
  points: 10, // 10 requests
  duration: 1, // per 1 second by IP
});

const rateLimitMiddleware = (req, res, next) => {
  rateLimiter
    .consume(req.ip)
    .then(() => next())
    .catch(() => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({
        success: false,
        message: "Too many requests. Please try again later.",
      });
    });
};

const sensitiveEndpointsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Sensitive endpoints rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: "Too many requests. Please try again later.",
    });
  },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
});

module.exports = {
  sensitiveEndpointsLimiter,
  rateLimitMiddleware,
  RedisClientMiddleware,
};
