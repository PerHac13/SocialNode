require("dotenv").config();

const express = require("express");
const proxy = require("express-http-proxy");
const helmet = require("helmet");
const cors = require("cors");

const routing = require("./middleware/routing");
const {
  rateLimitMiddleware,
  sensitiveEndpointsLimiter,
} = require("./middleware/rateLimiter");
const errorHandler = require("./middleware/errorHandler");

const logger = require("./utils/logger");

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(sensitiveEndpointsLimiter);
app.use(routing);

const proxyOptions = {
  proxyReqPathResolver: (req) => {
    return req.originalUrl.replace(/^\/v1/, "/api");
  },
  proxyErrorHandler: (err, res, next) => {
    logger.error(`Proxy error: ${err.message}`);
    res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  },
};

// Proxy to identity service
app.use(
  "/v1/auth",
  proxy(process.env.IDENTITY_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["Content-Type"] = "application/json";
      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        `Response received from Identity services: ${proxyRes.statusCode}`
      );
      return proxyResData;
    },
  })
);

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Api gateway running on port ${PORT}`);
  logger.info(`Identity service URL: ${process.env.IDENTITY_SERVICE_URL}`);
  logger.info(`Redis URL: ${process.env.REDIS_URL}`);
});

// unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise} reason: ${reason}`);
});
