require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");

const connectDB = require("./config/db");
const logger = require("./utils/logger");
const { connectToRabbitMQ, consumeEvent } = require("./utils/rabbitmq");
const routing = require("./middleware/routing");
const { sensitiveEndpointsLimiter } = require("./middleware/rateLimiter");
const errorHandler = require("./middleware/errorHandler");

const routes = require("./routes/media_routes");
const { handlePostDeleted } = require("./eventHandlers/media_event_handler");

const app = express();
const PORT = process.env.PORT || 4003;

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(routing);

app.use(sensitiveEndpointsLimiter);
// Routes
app.use("/api/media", routes);

app.use(errorHandler);

async function startServer() {
  try {
    await connectToRabbitMQ();
    await consumeEvent("post.deleted", handlePostDeleted);
    app.listen(PORT, () => {
      logger.info(`Media services running on port ${PORT}`);
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
