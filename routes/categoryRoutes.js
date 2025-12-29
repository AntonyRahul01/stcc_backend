const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const { authenticate } = require("../middleware/auth");
const {
  validateCategoryCreate,
  validateCategoryUpdate,
} = require("../middleware/validation");

// Public routes (get all and get by ID)
router.get("/user/", categoryController.getAllCategories);
router.get("/user/:id", categoryController.getCategoryById);

// Protected routes (require authentication)
router.get("/", authenticate, categoryController.getAllCategories);
router.get("/:id", authenticate, categoryController.getCategoryById);
router.post("/", authenticate, validateCategoryCreate, categoryController.createCategory);
router.put("/:id", authenticate, validateCategoryUpdate, categoryController.updateCategory);
router.delete("/:id", authenticate, categoryController.deleteCategory);

module.exports = router;

