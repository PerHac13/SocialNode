const mongoose = require("mongoose");
const logger = require("../utils/logger");

// Connect to MongoDB
function dbConnect() {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => logger.info("Connected to MongoDB"))
    .catch((err) => logger.error("Could not connect to MongoDB", err));
}

module.exports = dbConnect;
