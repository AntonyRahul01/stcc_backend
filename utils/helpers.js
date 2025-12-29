/**
 * Utility helper functions
 */

/**
 * Generate a random string
 * @param {number} length - Length of the string
 * @returns {string} Random string
 */
const generateRandomString = (length = 10) => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Sanitize input string
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
const sanitizeInput = (str) => {
  if (typeof str !== "string") return str;
  return str.trim().replace(/[<>]/g, "");
};

/**
 * Format response
 * @param {boolean} success - Success status
 * @param {string} message - Response message
 * @param {object} data - Response data
 * @returns {object} Formatted response
 */
const formatResponse = (success, message, data = null) => {
  return {
    success,
    message,
    data,
  };
};

module.exports = {
  generateRandomString,
  sanitizeInput,
  formatResponse,
};
