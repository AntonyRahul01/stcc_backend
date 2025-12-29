const Category = require("../models/Category");
const logger = require("../utils/logger");
const { formatResponse } = require("../utils/helpers");

/**
 * Get all categories
 * GET /api/categories
 */
module.exports.getAllCategories = async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      search: req.query.search,
    };

    const categories = await Category.findAll(filters);

    res.json(
      formatResponse(true, "Categories retrieved successfully", { categories })
    );
  } catch (error) {
    logger.error("Get all categories error:", error);
    next(error);
  }
};

/**
 * Get category by ID
 * GET /api/categories/:id
 */
module.exports.getCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json(formatResponse(false, "Category not found"));
    }

    res.json(
      formatResponse(true, "Category retrieved successfully", { category })
    );
  } catch (error) {
    logger.error("Get category by ID error:", error);
    next(error);
  }
};

/**
 * Create a new category
 * POST /api/categories
 */
module.exports.createCategory = async (req, res, next) => {
  try {
    const { name, description, slug, status } = req.body;

    // Check if slug already exists
    if (slug) {
      const existingCategory = await Category.findBySlug(slug);
      if (existingCategory) {
        return res
          .status(400)
          .json(
            formatResponse(false, "Category with this slug already exists")
          );
      }
    }

    const category = await Category.create({
      name,
      description,
      slug,
      status,
    });

    logger.info(`Category created: ${name} (ID: ${category.id})`);

    res
      .status(201)
      .json(
        formatResponse(true, "Category created successfully", { category })
      );
  } catch (error) {
    logger.error("Create category error:", error);

    // Handle duplicate slug error
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(400)
        .json(formatResponse(false, "Category with this slug already exists"));
    }

    next(error);
  }
};

/**
 * Update category
 * PUT /api/categories/:id
 */
module.exports.updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if category exists
    const existingCategory = await Category.findById(id);
    if (!existingCategory) {
      return res.status(404).json(formatResponse(false, "Category not found"));
    }

    // Check if slug is being updated and if it already exists
    if (updateData.slug && updateData.slug !== existingCategory.slug) {
      const slugExists = await Category.findBySlug(updateData.slug);
      if (slugExists) {
        return res
          .status(400)
          .json(
            formatResponse(false, "Category with this slug already exists")
          );
      }
    }

    const category = await Category.update(id, updateData);

    logger.info(`Category updated: ID ${id}`);

    res.json(
      formatResponse(true, "Category updated successfully", { category })
    );
  } catch (error) {
    logger.error("Update category error:", error);

    // Handle duplicate slug error
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(400)
        .json(formatResponse(false, "Category with this slug already exists"));
    }

    next(error);
  }
};

/**
 * Delete category
 * DELETE /api/categories/:id
 */
module.exports.deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if category exists
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json(formatResponse(false, "Category not found"));
    }

    const deleted = await Category.delete(id);

    if (!deleted) {
      return res
        .status(400)
        .json(formatResponse(false, "Failed to delete category"));
    }

    logger.info(`Category deleted: ID ${id}`);

    res.json(formatResponse(true, "Category deleted successfully"));
  } catch (error) {
    logger.error("Delete category error:", error);
    next(error);
  }
};
