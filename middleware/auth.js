const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");
const { formatResponse } = require("../utils/helpers");

/**
 * Authentication middleware
 * Verifies JWT token from Authorization header
 */
const authenticate = (req, res, next) => {
  try {
    // Get token from header (case-insensitive check)
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader) {
      logger.warn(
        `Unauthorized access attempt: ${req.method} ${req.originalUrl} - No Authorization header`
      );
      return res
        .status(401)
        .json(
          formatResponse(
            false,
            "No token provided. Authorization header required."
          )
        );
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res
        .status(401)
        .json(
          formatResponse(false, "Token not found in Authorization header.")
        );
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    );

    // Attach user info to request
    req.user = decoded;
    next();
  } catch (error) {
    logger.error("Authentication error:", error);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json(formatResponse(false, "Token has expired."));
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json(formatResponse(false, "Invalid token."));
    }

    return res
      .status(401)
      .json(formatResponse(false, "Authentication failed."));
  }
};

/**
 * Optional authentication middleware
 * Attaches user info if token is valid, but doesn't require it
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader) {
      const token = authHeader.split(" ")[1];
      if (token) {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || "your-secret-key"
        );
        req.user = decoded;
      }
    }
  } catch (error) {
    // Silently fail for optional auth
    logger.debug("Optional auth failed:", error.message);
  }

  next();
};

module.exports = {
  authenticate,
  optionalAuth,
};
