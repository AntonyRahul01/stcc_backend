const db = require("../config/database");
const logger = require("../utils/logger");

/**
 * Convert ISO 8601 datetime string to MySQL DATETIME format
 * @param {string} dateTimeString - ISO 8601 datetime string (e.g., '2025-12-04T07:22:00.000Z')
 * @returns {string} MySQL DATETIME format (e.g., '2025-12-04 07:22:00')
 */
const formatDateTimeForMySQL = (dateTimeString) => {
  if (!dateTimeString) return dateTimeString;
  
  try {
    // Parse the ISO 8601 string
    const date = new Date(dateTimeString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      throw new Error("Invalid date");
    }
    
    // Format as MySQL DATETIME: YYYY-MM-DD HH:MM:SS
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  } catch (error) {
    logger.error("Error formatting datetime for MySQL:", error);
    throw new Error(`Invalid datetime format: ${dateTimeString}`);
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

    if (filters.category_id) {
      query += " AND n.category_id = ?";
      params.push(filters.category_id);
    }

    if (filters.status) {
      query += " AND n.status = ?";
      params.push(filters.status);
    }

    if (filters.search) {
      query += " AND (n.title LIKE ? OR n.description LIKE ? OR n.location LIKE ?)";
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (filters.date_from) {
      query += " AND n.date_time >= ?";
      params.push(formatDateTimeForMySQL(filters.date_from));
    }

    if (filters.date_to) {
      query += " AND n.date_time <= ?";
      params.push(formatDateTimeForMySQL(filters.date_to));
    }

    query += " ORDER BY n.date_time DESC, n.created_at DESC";

    // Add pagination
    if (filters.limit) {
      query += " LIMIT ?";
      params.push(parseInt(filters.limit));

      if (filters.offset) {
        query += " OFFSET ?";
        params.push(parseInt(filters.offset));
      }
    }

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

    // Convert ISO 8601 datetime to MySQL format
    const formattedDateTime = formatDateTimeForMySQL(date_time);

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
    logger.info(
      `News and Events created: ${title} (ID: ${result.insertId})`
    );
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
    let query =
      "SELECT COUNT(*) as total FROM news_and_events WHERE 1=1";
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
      query +=
        " AND (title LIKE ? OR description LIKE ? OR location LIKE ?)";
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

