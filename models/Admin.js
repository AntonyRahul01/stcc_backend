const db = require("../config/database");
const bcrypt = require("bcryptjs");
const logger = require("../utils/logger");

/**
 * Find admin by ID
 * @param {number} id - Admin ID
 * @returns {Promise<object|null>} Admin object or null
 */
module.exports.findById = async (id) => {
  try {
    const [rows] = await db.execute(
      "SELECT id, email, name, created_at, updated_at FROM admins WHERE id = ?",
      [id]
    );
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    logger.error("Error finding admin by ID:", error);
    throw error;
  }
};

/**
 * Find admin by email
 * @param {string} email - Admin email
 * @returns {Promise<object|null>} Admin object with password or null
 */
module.exports.findByEmail = async (email) => {
  try {
    const [rows] = await db.execute("SELECT * FROM admins WHERE email = ?", [
      email,
    ]);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    logger.error("Error finding admin by email:", error);
    throw error;
  }
};

/**
 * Create a new admin user
 * @param {object} adminData - Admin data (email, password, name)
 * @returns {Promise<object>} Created admin object
 */
module.exports.create = async (adminData) => {
  try {
    const { email, password, name } = adminData;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.execute(
      "INSERT INTO admins (email, password, name, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())",
      [email, hashedPassword, name]
    );

    const admin = await module.exports.findById(result.insertId);
    logger.info(`Admin created: ${email}`);
    return admin;
  } catch (error) {
    logger.error("Error creating admin:", error);
    throw error;
  }
};

/**
 * Verify admin password
 * @param {string} plainPassword - Plain text password
 * @param {string} hashedPassword - Hashed password
 * @returns {Promise<boolean>} True if password matches
 */
module.exports.verifyPassword = async (plainPassword, hashedPassword) => {
  try {
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (error) {
    logger.error("Error verifying password:", error);
    throw error;
  }
};

/**
 * Update admin
 * @param {number} id - Admin ID
 * @param {object} updateData - Data to update
 * @returns {Promise<object>} Updated admin object
 */
module.exports.update = async (id, updateData) => {
  try {
    const fields = [];
    const values = [];

    if (updateData.name) {
      fields.push("name = ?");
      values.push(updateData.name);
    }

    if (updateData.password) {
      const hashedPassword = await bcrypt.hash(updateData.password, 10);
      fields.push("password = ?");
      values.push(hashedPassword);
    }

    if (fields.length === 0) {
      return await module.exports.findById(id);
    }

    fields.push("updated_at = NOW()");
    values.push(id);

    await db.execute(
      `UPDATE admins SET ${fields.join(", ")} WHERE id = ?`,
      values
    );

    return await module.exports.findById(id);
  } catch (error) {
    logger.error("Error updating admin:", error);
    throw error;
  }
};

/**
 * Delete admin
 * @param {number} id - Admin ID
 * @returns {Promise<boolean>} True if deleted
 */
module.exports.delete = async (id) => {
  try {
    const [result] = await db.execute("DELETE FROM admins WHERE id = ?", [id]);
    return result.affectedRows > 0;
  } catch (error) {
    logger.error("Error deleting admin:", error);
    throw error;
  }
};

/**
 * Get all admins
 * @returns {Promise<Array>} Array of admin objects
 */
module.exports.findAll = async () => {
  try {
    const [rows] = await db.execute(
      "SELECT id, email, name, created_at, updated_at FROM admins ORDER BY created_at DESC"
    );
    return rows;
  } catch (error) {
    logger.error("Error finding all admins:", error);
    throw error;
  }
};
