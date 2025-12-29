const Admin = require("../models/Admin");
const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");
const { formatResponse } = require("../utils/helpers");

/**
 * Generate JWT token
 * @param {object} admin - Admin object
 * @returns {string} JWT token
 */
const generateToken = (admin) => {
  return jwt.sign(
    {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      type: "admin",
    },
    process.env.JWT_SECRET || "your-secret-key",
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "24h",
    }
  );
};

/**
 * Admin login
 * POST /api/admin/login
 */
module.exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find admin by email
    const admin = await Admin.findByEmail(email);

    if (!admin) {
      return res
        .status(401)
        .json(formatResponse(false, "Invalid email or password"));
    }

    // Verify password
    const isPasswordValid = await Admin.verifyPassword(
      password,
      admin.password
    );

    if (!isPasswordValid) {
      return res
        .status(401)
        .json(formatResponse(false, "Invalid email or password"));
    }

    // Generate token
    const token = generateToken(admin);

    // Remove password from response
    const { password: _, ...adminWithoutPassword } = admin;

    logger.info(`Admin logged in: ${email}`);

    res.json(
      formatResponse(true, "Login successful", {
        admin: adminWithoutPassword,
        token,
      })
    );
  } catch (error) {
    logger.error("Login error:", error);
    next(error);
  }
};

/**
 * Admin registration
 * POST /api/admin/register
 */
module.exports.register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    // Check if admin already exists
    const existingAdmin = await Admin.findByEmail(email);

    if (existingAdmin) {
      return res
        .status(400)
        .json(formatResponse(false, "Admin with this email already exists"));
    }

    // Create admin
    const admin = await Admin.create({ email, password, name });

    // Generate token
    const token = generateToken(admin);

    logger.info(`Admin registered: ${email}`);

    res.status(201).json(
      formatResponse(true, "Admin registered successfully", {
        admin,
        token,
      })
    );
  } catch (error) {
    logger.error("Registration error:", error);
    next(error);
  }
};

/**
 * Get current admin profile
 * GET /api/admin/profile
 */
module.exports.getProfile = async (req, res, next) => {
  try {
    const adminId = req.user.id;
    const admin = await Admin.findById(adminId);

    if (!admin) {
      return res.status(404).json(formatResponse(false, "Admin not found"));
    }

    res.json(formatResponse(true, "Profile retrieved successfully", { admin }));
  } catch (error) {
    logger.error("Get profile error:", error);
    next(error);
  }
};

/**
 * Update admin profile
 * PUT /api/admin/profile
 */
module.exports.updateProfile = async (req, res, next) => {
  try {
    const adminId = req.user.id;
    const updateData = req.body;

    // Don't allow email update through this endpoint
    delete updateData.email;

    const admin = await Admin.update(adminId, updateData);

    logger.info(`Admin profile updated: ${adminId}`);

    res.json(formatResponse(true, "Profile updated successfully", { admin }));
  } catch (error) {
    logger.error("Update profile error:", error);
    next(error);
  }
};

/**
 * Get all admins (admin only)
 * GET /api/admin/all
 */
module.exports.getAllAdmins = async (req, res, next) => {
  try {
    const admins = await Admin.findAll();

    res.json(formatResponse(true, "Admins retrieved successfully", { admins }));
  } catch (error) {
    logger.error("Get all admins error:", error);
    next(error);
  }
};
