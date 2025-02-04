require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");

const connectDB = require("./config/db");
const routing = require("./middleware/routing");
const { sensitiveEndpointsLimiter } = require("./middleware/rateLimiter");
const errorHandler = require("./middleware/errorHandler");

const routes = require("./routes/media_routes");
const logger = require("./utils/logger");

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

app.listen(PORT, () => {
  logger.info(`Media services running on port ${PORT}`);
});

// unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise} reason: ${reason}`);
});
