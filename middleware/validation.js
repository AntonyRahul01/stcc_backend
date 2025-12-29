const { body, validationResult } = require("express-validator");
const { formatResponse } = require("../utils/helpers");

/**
 * Validation result handler middleware
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json(
        formatResponse(false, "Validation failed", { errors: errors.array() })
      );
  }
  next();
};

/**
 * Admin login validation rules
 */
const validateAdminLogin = [
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  handleValidationErrors,
];

/**
 * Admin registration validation rules
 */
const validateAdminRegister = [
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),
  handleValidationErrors,
];

/**
 * Category creation validation rules
 */
const validateCategoryCreate = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Category name is required")
    .isLength({ min: 2, max: 255 })
    .withMessage("Category name must be between 2 and 255 characters"),
  body("slug")
    .trim()
    .notEmpty()
    .withMessage("Category slug is required")
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage("Slug must be lowercase alphanumeric with hyphens only")
    .isLength({ min: 2, max: 255 })
    .withMessage("Slug must be between 2 and 255 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description must not exceed 1000 characters"),
  body("status")
    .optional()
    .isIn(["active", "inactive"])
    .withMessage("Status must be either 'active' or 'inactive'"),
  handleValidationErrors,
];

/**
 * Category update validation rules
 */
const validateCategoryUpdate = [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Category name cannot be empty")
    .isLength({ min: 2, max: 255 })
    .withMessage("Category name must be between 2 and 255 characters"),
  body("slug")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Category slug cannot be empty")
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage("Slug must be lowercase alphanumeric with hyphens only")
    .isLength({ min: 2, max: 255 })
    .withMessage("Slug must be between 2 and 255 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description must not exceed 1000 characters"),
  body("status")
    .optional()
    .isIn(["active", "inactive"])
    .withMessage("Status must be either 'active' or 'inactive'"),
  handleValidationErrors,
];

/**
 * News creation validation rules
 */
const validateNewsCreate = [
  body("category_id")
    .notEmpty()
    .withMessage("Category ID is required")
    .isInt()
    .withMessage("Category ID must be a valid integer"),
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ min: 3, max: 255 })
    .withMessage("Title must be between 3 and 255 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage("Description must not exceed 5000 characters"),
  body("location")
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage("Location must not exceed 255 characters"),
  body("cover_image")
    .optional()
    .custom((value) => {
      // Allow empty string, null, or valid URL
      if (!value || value === "") return true;
      if (typeof value === "string" && /^https?:\/\/.+/.test(value)) {
        return value.length <= 500;
      }
      return false;
    })
    .withMessage("Cover image must be a valid URL (max 500 characters) or uploaded as file"),
  body("date_time")
    .notEmpty()
    .withMessage("Date and time is required")
    .isISO8601()
    .withMessage("Date and time must be in ISO 8601 format"),
  body("status")
    .optional()
    .isIn(["active", "inactive"])
    .withMessage("Status must be either 'active' or 'inactive'"),
  body("images")
    .optional()
    .custom((value) => {
      // Allow empty string, null, array, or string (JSON)
      if (!value || value === "") return true;
      if (Array.isArray(value)) return true;
      if (typeof value === "string") {
        // Try to parse as JSON array
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed);
        } catch {
          return true; // Allow string, will be handled in controller
        }
      }
      return false;
    })
    .withMessage("Images can be uploaded as files, provided as array of URLs, or JSON string array"),
  handleValidationErrors,
];

/**
 * News update validation rules
 */
const validateNewsUpdate = [
  body("category_id")
    .optional()
    .isInt()
    .withMessage("Category ID must be a valid integer"),
  body("title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Title cannot be empty")
    .isLength({ min: 3, max: 255 })
    .withMessage("Title must be between 3 and 255 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage("Description must not exceed 5000 characters"),
  body("location")
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage("Location must not exceed 255 characters"),
  body("cover_image")
    .optional()
    .custom((value) => {
      // Allow empty string, null, or valid URL
      if (!value || value === "") return true;
      if (typeof value === "string" && /^https?:\/\/.+/.test(value)) {
        return value.length <= 500;
      }
      return false;
    })
    .withMessage("Cover image must be a valid URL (max 500 characters) or uploaded as file"),
  body("date_time")
    .optional()
    .isISO8601()
    .withMessage("Date and time must be in ISO 8601 format"),
  body("status")
    .optional()
    .isIn(["active", "inactive"])
    .withMessage("Status must be either 'active' or 'inactive'"),
  body("images")
    .optional()
    .custom((value) => {
      // Allow empty string, null, array, or string (JSON)
      if (!value || value === "") return true;
      if (Array.isArray(value)) return true;
      if (typeof value === "string") {
        // Try to parse as JSON array
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed);
        } catch {
          return true; // Allow string, will be handled in controller
        }
      }
      return false;
    })
    .withMessage("Images can be uploaded as files, provided as array of URLs, or JSON string array"),
  handleValidationErrors,
];

module.exports = {
  handleValidationErrors,
  validateAdminLogin,
  validateAdminRegister,
  validateCategoryCreate,
  validateCategoryUpdate,
  validateNewsCreate,
  validateNewsUpdate,
};
