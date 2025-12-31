const db = require("../config/database");
const logger = require("../utils/logger");

/**
 * Convert ISO 8601 datetime string to MySQL DATETIME format
 * @param {string} dateTimeString - ISO 8601 datetime string (e.g., '2025-12-04T07:22:00.000Z')
 * @returns {string} MySQL DATETIME format (e.g., '2025-12-04 07:22:00')
 */
const formatDateTimeForMySQL = (dateTimeString) => {
  // This function should only be called with valid string values
  // Return null/undefined as-is only if explicitly passed
  if (dateTimeString === null || dateTimeString === undefined) {
    return dateTimeString;
  }

  // Ensure it's a string
  if (typeof dateTimeString !== "string") {
    throw new Error(
      `Expected string, got ${typeof dateTimeString}: ${dateTimeString}`
    );
  }

  // Trim and check for empty string
  const trimmed = dateTimeString.trim();
  if (trimmed === "") {
    throw new Error("Empty datetime string is not allowed");
  }

  // If already in MySQL format (YYYY-MM-DD HH:MM:SS), return as is
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    // Parse the ISO 8601 string
    const date = new Date(trimmed);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date: ${trimmed}`);
    }

    // Format as MySQL DATETIME: YYYY-MM-DD HH:MM:SS
    // Use UTC methods to preserve the original timezone
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    const hours = String(date.getUTCHours()).padStart(2, "0");
    const minutes = String(date.getUTCMinutes()).padStart(2, "0");
    const seconds = String(date.getUTCSeconds()).padStart(2, "0");

    const formatted = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

    // Validate the formatted result
    if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(formatted)) {
      throw new Error(`Failed to format datetime correctly: ${formatted}`);
    }

    logger.debug(`Converted datetime: ${trimmed} -> ${formatted}`);
    return formatted;
  } catch (error) {
    logger.error("Error formatting datetime for MySQL:", error);
    throw new Error(`Invalid datetime format: ${trimmed}. ${error.message}`);
  }
};

/**
 * Find news and events by ID
 * @param {number} id - News and Events ID
 * @returns {Promise<object|null>} News and Events object or null
 */
module.exports.findById = async (id) => {
  try {
    const [rows] = await db.execute(
      `SELECT n.*, c.name as category_name, c.slug as category_slug,
       a.name as created_by_name
       FROM news_and_events n
       LEFT JOIN categories c ON n.category_id = c.id
       LEFT JOIN admins a ON n.created_by = a.id
       WHERE n.id = ?`,
      [id]
    );
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    logger.error("Error finding news and events by ID:", error);
    throw error;
  }
};

/**
 * Get all news and events with filters
 * @param {object} filters - Optional filters (category_id, status, search, date_from, date_to)
 * @returns {Promise<Array>} Array of news and events objects
 */
module.exports.findAll = async (filters = {}) => {
  try {
    let query = `SELECT n.*, c.name as category_name, c.slug as category_slug,
                 a.name as created_by_name
                 FROM news_and_events n
                 LEFT JOIN categories c ON n.category_id = c.id
                 LEFT JOIN admins a ON n.created_by = a.id
                 WHERE 1=1`;
    const params = [];

    if (
      filters.category_id !== undefined &&
      filters.category_id !== null &&
      filters.category_id !== ""
    ) {
      const categoryId = parseInt(filters.category_id, 10);
      if (isNaN(categoryId)) {
        throw new Error(`Invalid category_id: ${filters.category_id}`);
      }
      query += " AND n.category_id = ?";
      params.push(categoryId);
    }

    if (
      filters.status !== undefined &&
      filters.status !== null &&
      filters.status !== ""
    ) {
      if (typeof filters.status !== "string") {
        throw new Error(`Invalid status type: ${typeof filters.status}`);
      }
      query += " AND n.status = ?";
      params.push(filters.status);
    }

    if (
      filters.search !== undefined &&
      filters.search !== null &&
      filters.search !== ""
    ) {
      if (typeof filters.search !== "string") {
        throw new Error(`Invalid search type: ${typeof filters.search}`);
      }
      query +=
        " AND (n.title LIKE ? OR n.description LIKE ? OR n.location LIKE ?)";
      const searchTerm = `%${filters.search.trim()}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (
      filters.date_from &&
      typeof filters.date_from === "string" &&
      filters.date_from.trim() !== ""
    ) {
      try {
        const formattedDateFrom = formatDateTimeForMySQL(filters.date_from);
        if (!formattedDateFrom || typeof formattedDateFrom !== "string") {
          throw new Error(
            `formatDateTimeForMySQL returned invalid value: ${formattedDateFrom}`
          );
        }
        query += " AND n.date_time >= ?";
        params.push(formattedDateFrom);
      } catch (error) {
        logger.error("Error formatting date_from:", error);
        throw new Error(
          `Invalid date_from format: ${filters.date_from}. ${error.message}`
        );
      }
    }

    if (
      filters.date_to &&
      typeof filters.date_to === "string" &&
      filters.date_to.trim() !== ""
    ) {
      try {
        const formattedDateTo = formatDateTimeForMySQL(filters.date_to);
        if (!formattedDateTo || typeof formattedDateTo !== "string") {
          throw new Error(
            `formatDateTimeForMySQL returned invalid value: ${formattedDateTo}`
          );
        }
        query += " AND n.date_time <= ?";
        params.push(formattedDateTo);
      } catch (error) {
        logger.error("Error formatting date_to:", error);
        throw new Error(
          `Invalid date_to format: ${filters.date_to}. ${error.message}`
        );
      }
    }

    query += " ORDER BY n.date_time DESC, n.created_at DESC";

    // Add pagination
    // Note: LIMIT and OFFSET must be integers in the query string, not parameters
    // MySQL2 doesn't support parameterized LIMIT/OFFSET in prepared statements
    if (filters.limit !== undefined && filters.limit !== null) {
      const limit = parseInt(filters.limit, 10);
      if (isNaN(limit) || limit < 1) {
        throw new Error(`Invalid limit value: ${filters.limit}`);
      }

      if (filters.offset !== undefined && filters.offset !== null) {
        const offset = parseInt(filters.offset, 10);
        if (isNaN(offset) || offset < 0) {
          throw new Error(`Invalid offset value: ${filters.offset}`);
        }
        // Use integer values directly in query (safe because we validated them)
        query += ` LIMIT ${limit} OFFSET ${offset}`;
      } else {
        // Use integer value directly in query (safe because we validated it)
        query += ` LIMIT ${limit}`;
      }
    }

    // Validate params array - check for undefined/null values and log for debugging
    const invalidParams = params
      .map((param, index) =>
        param === undefined || param === null ? index : null
      )
      .filter((index) => index !== null);

    if (invalidParams.length > 0) {
      logger.error(
        "Found undefined/null in params array at indices:",
        invalidParams
      );
      logger.error("Full params array:", params);
      logger.error("Query:", query);
      throw new Error(
        `Invalid parameters at indices: ${invalidParams.join(", ")}`
      );
    }

    // Count placeholders in query
    const placeholderCount = (query.match(/\?/g) || []).length;
    if (placeholderCount !== params.length) {
      logger.error("Parameter mismatch detected:", {
        query,
        params,
        placeholderCount,
        paramsLength: params.length,
      });
      throw new Error(
        `Parameter count mismatch: ${placeholderCount} placeholders but ${params.length} parameters`
      );
    }

    logger.debug(`Executing query with ${params.length} parameters`);
    const [rows] = await db.execute(query, params);
    return rows;
  } catch (error) {
    logger.error("Error finding all news and events:", error);
    throw error;
  }
};

/**
 * Create a new news and events
 * @param {object} newsAndEventsData - News and Events data
 * @returns {Promise<object>} Created news and events object
 */
module.exports.create = async (newsAndEventsData) => {
  try {
    const {
      category_id,
      title,
      description,
      location,
      cover_image,
      date_time,
      status = "active",
      created_by,
    } = newsAndEventsData;

    // Validate date_time is provided
    if (!date_time) {
      throw new Error("date_time is required");
    }

    // Convert ISO 8601 datetime to MySQL format
    const formattedDateTime = formatDateTimeForMySQL(date_time);

    // Log for debugging
    logger.debug(
      `Original date_time: ${date_time}, Formatted: ${formattedDateTime}`
    );

    const [result] = await db.execute(
      `INSERT INTO news_and_events (category_id, title, description, location, cover_image, date_time, status, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        category_id,
        title,
        description || null,
        location || null,
        cover_image || null,
        formattedDateTime,
        status,
        created_by || null,
      ]
    );

    const newsAndEvents = await module.exports.findById(result.insertId);
    logger.info(`News and Events created: ${title} (ID: ${result.insertId})`);
    return newsAndEvents;
  } catch (error) {
    logger.error("Error creating news and events:", error);
    throw error;
  }
};

/**
 * Update news and events
 * @param {number} id - News and Events ID
 * @param {object} updateData - Data to update
 * @returns {Promise<object>} Updated news and events object
 */
module.exports.update = async (id, updateData) => {
  try {
    const fields = [];
    const values = [];

    if (updateData.category_id !== undefined) {
      fields.push("category_id = ?");
      values.push(updateData.category_id);
    }

    if (updateData.title !== undefined) {
      fields.push("title = ?");
      values.push(updateData.title);
    }

    if (updateData.description !== undefined) {
      fields.push("description = ?");
      values.push(updateData.description);
    }

    if (updateData.location !== undefined) {
      fields.push("location = ?");
      values.push(updateData.location);
    }

    if (updateData.cover_image !== undefined) {
      fields.push("cover_image = ?");
      values.push(updateData.cover_image);
    }

    if (updateData.date_time !== undefined) {
      fields.push("date_time = ?");
      // Convert ISO 8601 datetime to MySQL format
      values.push(formatDateTimeForMySQL(updateData.date_time));
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
      `UPDATE news_and_events SET ${fields.join(", ")} WHERE id = ?`,
      values
    );

    return await module.exports.findById(id);
  } catch (error) {
    logger.error("Error updating news and events:", error);
    throw error;
  }
};

/**
 * Delete news and events
 * @param {number} id - News and Events ID
 * @returns {Promise<boolean>} True if deleted
 */
module.exports.delete = async (id) => {
  try {
    const [result] = await db.execute(
      "DELETE FROM news_and_events WHERE id = ?",
      [id]
    );
    return result.affectedRows > 0;
  } catch (error) {
    logger.error("Error deleting news and events:", error);
    throw error;
  }
};

/**
 * Get count of news and events
 * @param {object} filters - Optional filters
 * @returns {Promise<number>} Count of news and events
 */
module.exports.count = async (filters = {}) => {
  try {
    let query = "SELECT COUNT(*) as total FROM news_and_events WHERE 1=1";
    const params = [];

    if (filters.category_id) {
      query += " AND category_id = ?";
      params.push(filters.category_id);
    }

    if (filters.status) {
      query += " AND status = ?";
      params.push(filters.status);
    }

    if (filters.search) {
      query += " AND (title LIKE ? OR description LIKE ? OR location LIKE ?)";
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    const [rows] = await db.execute(query, params);
    return rows[0].total;
  } catch (error) {
    logger.error("Error counting news and events:", error);
    throw error;
  }
};
