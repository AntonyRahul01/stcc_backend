const db = require("../config/database");
const logger = require("../utils/logger");

/**
 * Find category by ID
 * @param {number} id - Category ID
 * @returns {Promise<object|null>} Category object or null
 */
module.exports.findById = async (id) => {
  try {
    const [rows] = await db.execute(
      "SELECT * FROM categories WHERE id = ?",
      [id]
    );
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    logger.error("Error finding category by ID:", error);
    throw error;
  }
};

/**
 * Find category by slug
 * @param {string} slug - Category slug
 * @returns {Promise<object|null>} Category object or null
 */
module.exports.findBySlug = async (slug) => {
  try {
    const [rows] = await db.execute(
      "SELECT * FROM categories WHERE slug = ?",
      [slug]
    );
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    logger.error("Error finding category by slug:", error);
    throw error;
  }
};

/**
 * Get all categories
 * @param {object} filters - Optional filters (status, search)
 * @returns {Promise<Array>} Array of category objects
 */
module.exports.findAll = async (filters = {}) => {
  try {
    let query = "SELECT * FROM categories WHERE 1=1";
    const params = [];

    if (filters.status) {
      query += " AND status = ?";
      params.push(filters.status);
    }

    if (filters.search) {
      query += " AND (name LIKE ? OR description LIKE ?)";
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
    }

    query += " ORDER BY created_at DESC";

    const [rows] = await db.execute(query, params);
    return rows;
  } catch (error) {
    logger.error("Error finding all categories:", error);
    throw error;
  }
};

/**
 * Create a new category
 * @param {object} categoryData - Category data (name, description, slug, status)
 * @returns {Promise<object>} Created category object
 */
module.exports.create = async (categoryData) => {
  try {
    const { name, description, slug, status = "active" } = categoryData;

    const [result] = await db.execute(
      "INSERT INTO categories (name, description, slug, status, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())",
      [name, description || null, slug, status]
    );

    const category = await module.exports.findById(result.insertId);
    logger.info(`Category created: ${name} (ID: ${result.insertId})`);
    return category;
  } catch (error) {
    logger.error("Error creating category:", error);
    throw error;
  }
};

/**
 * Update category
 * @param {number} id - Category ID
 * @param {object} updateData - Data to update
 * @returns {Promise<object>} Updated category object
 */
module.exports.update = async (id, updateData) => {
  try {
    const fields = [];
    const values = [];

    if (updateData.name !== undefined) {
      fields.push("name = ?");
      values.push(updateData.name);
    }

    if (updateData.description !== undefined) {
      fields.push("description = ?");
      values.push(updateData.description);
    }

    if (updateData.slug !== undefined) {
      fields.push("slug = ?");
      values.push(updateData.slug);
    }

    if (updateData.status !== undefined) {
      fields.push("status = ?");
      values.push(updateData.status);
    }

    if (fields.length === 0) {
      return await module.exports.findById(id);
    }

    fields.push("updated_at = NOW()");
    values.push(id);

    await db.execute(
      `UPDATE categories SET ${fields.join(", ")} WHERE id = ?`,
      values
    );

    return await module.exports.findById(id);
  } catch (error) {
    logger.error("Error updating category:", error);
    throw error;
  }
};

/**
 * Delete category
 * @param {number} id - Category ID
 * @returns {Promise<boolean>} True if deleted
 */
module.exports.delete = async (id) => {
  try {
    const [result] = await db.execute("DELETE FROM categories WHERE id = ?", [
      id,
    ]);
    return result.affectedRows > 0;
  } catch (error) {
    logger.error("Error deleting category:", error);
    throw error;
  }
};

