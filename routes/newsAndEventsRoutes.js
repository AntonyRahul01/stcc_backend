const express = require("express");
const router = express.Router();
const newsAndEventsController = require("../controllers/newsAndEventsController");
const { authenticate } = require("../middleware/auth");
const {
  validateNewsCreate,
  validateNewsUpdate,
} = require("../middleware/validation");
const { uploadFiles } = require("../config/upload");

// Middleware to handle file uploads with error handling
const handleFileUpload = (req, res, next) => {
  uploadFiles(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
    next();
  });
};

// Public routes (user-side - no authentication required)
router.get("/public", newsAndEventsController.getActiveNewsAndEvents);
router.get("/public/:id", newsAndEventsController.getActiveNewsAndEventsById);

// Protected routes (admin-side - require authentication)
router.get("/", authenticate, newsAndEventsController.getAllNewsAndEvents);
router.get("/:id", authenticate, newsAndEventsController.getNewsAndEventsById);

// Protected routes (require authentication)
router.post(
  "/",
  authenticate,
  handleFileUpload,
  validateNewsCreate,
  newsAndEventsController.createNewsAndEvents
);
router.put(
  "/:id",
  authenticate,
  handleFileUpload,
  validateNewsUpdate,
  newsAndEventsController.updateNewsAndEvents
);
router.delete(
  "/:id",
  authenticate,
  newsAndEventsController.deleteNewsAndEvents
);

module.exports = router;
