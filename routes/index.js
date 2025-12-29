const express = require("express");
const router = express.Router();
const adminRoutes = require("./adminRoutes");
const categoryRoutes = require("./categoryRoutes");
const newsAndEventsRoutes = require("./newsAndEventsRoutes");

// API routes
router.use("/admin", adminRoutes);
router.use("/categories", categoryRoutes);
router.use("/news-and-events", newsAndEventsRoutes);

// Health check route
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
