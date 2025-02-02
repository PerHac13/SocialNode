const logger = require("../utils/logger");

const routing = (req, res, next) => {
  logger.info(`Received a ${req?.method} request to ${req?.url}`);
  logger.info(`Request body: ${req.body}`);
  next();
};

module.exports = routing;
