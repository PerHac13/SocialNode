require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");

const connectDB = require("./config/db");
const routing = require("./middleware/routing");
const {
  sensitiveEndpointsLimiter,
  RedisClientMiddleware,
} = require("./middleware/rateLimiter");
const errorHandler = require("./middleware/errorHandler");

const routes = require("./routes/post_routes");
const logger = require("./utils/logger");
const { connectToRabbitMQ } = require("./utils/rabbitmq");

const app = express();
const PORT = process.env.PORT || 4002;

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(routing);

app.use(sensitiveEndpointsLimiter);
// Routes
app.use("/api/posts", RedisClientMiddleware, routes);

app.use(errorHandler);
async function startServer() {
  try {
    await connectToRabbitMQ();
    app.listen(PORT, () => {
      logger.info(`Post services running on port ${PORT}`);
    });
  } catch (error) {
    logger.error(`Failed to connect to server: ${error}`);
    process.exit(1);
  }
}

startServer();

// unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise} reason: ${reason}`);
});
