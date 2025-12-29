const logger = require("../utils/logger");
const { formatResponse } = require("../utils/helpers");

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  logger.error("Error:", {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  // Default error
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";

  // Handle specific error types
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Validation error";
  } else if (err.name === "UnauthorizedError") {
    statusCode = 401;
    message = "Unauthorized";
  } else if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid ID format";
  }

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === "production" && statusCode === 500) {
    message = "Internal server error";
  }

  res
    .status(statusCode)
    .json(
      formatResponse(
        false,
        message,
        process.env.NODE_ENV === "development" ? { stack: err.stack } : null
      )
    );
};

/**
 * 404 Not Found handler
 */
const notFound = (req, res, next) => {
  const error = new Error(`Route ${req.originalUrl} not found`);
  error.statusCode = 404;
  next(error);
};

module.exports = {
  errorHandler,
  notFound,
};
