require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");

const connectDB = require("./config/db");
const logger = require("./utils/logger");
const { connectToRabbitMQ, consumeEvent } = require("./utils/rabbitmq");
const routing = require("./middleware/routing");
const {
  sensitiveEndpointsLimiter,
  RedisClientMiddleware,
} = require("./middleware/rateLimiter");
const errorHandler = require("./middleware/errorHandler");

const routes = require("./routes/search_routes");
const {
  handlePostCreated,
  handlePostDeleted,
} = require("./eventHandlers/search_event_handler");

const app = express();
const PORT = process.env.PORT || 4004;

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(routing);

app.use(sensitiveEndpointsLimiter);
// Routes
app.use("/api/search", RedisClientMiddleware, routes);

app.use(errorHandler);

async function startServer() {
  try {
    await connectToRabbitMQ();
    await consumeEvent("post.created", handlePostCreated);
    await consumeEvent("post.deleted", handlePostDeleted);
    app.listen(PORT, () => {
      logger.info(`search services running on port ${PORT}`);
    });
  } catch (e) {
    logger.error(`Failed to connect to server: ${e}`);
    process.exit(1);
  }
}

startServer();

// unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise} reason: ${reason}`);
});
