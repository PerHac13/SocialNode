const logger = require("../utils/logger");

const errorHandler = (err, req, res, next) => {
  logger.error(err);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    status: err.status || 500,
  });
};

module.exports = errorHandler;
