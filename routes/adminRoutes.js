const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { authenticate } = require("../middleware/auth");
const {
  validateAdminLogin,
  validateAdminRegister,
} = require("../middleware/validation");

// Public routes
router.post("/login", validateAdminLogin, adminController.login);
router.post("/register", validateAdminRegister, adminController.register);

// Protected routes (require authentication)
router.get("/profile", authenticate, adminController.getProfile);
router.put("/profile", authenticate, adminController.updateProfile);
router.get("/all", authenticate, adminController.getAllAdmins);

module.exports = router;
