const db = require("../config/database");
const logger = require("../utils/logger");

/**
 * Get all images for a news and events item
 * @param {number} newsAndEventsId - News and Events ID
 * @returns {Promise<Array>} Array of image objects
 */
module.exports.findByNewsAndEventsId = async (newsAndEventsId) => {
  try {
    const [rows] = await db.execute(
      "SELECT * FROM news_and_events_images WHERE news_and_events_id = ? ORDER BY image_order ASC, created_at ASC",
      [newsAndEventsId]
    );
    return rows;
  } catch (error) {
    logger.error(
      "Error finding images by news and events ID:",
      error
    );
    throw error;
  }
};

/**
 * Add image to news and events
 * @param {number} newsAndEventsId - News and Events ID
 * @param {string} imageUrl - Image URL
 * @param {number} imageOrder - Image order
 * @returns {Promise<object>} Created image object
 */
module.exports.create = async (
  newsAndEventsId,
  imageUrl,
  imageOrder = 0
) => {
  try {
    const [result] = await db.execute(
      "INSERT INTO news_and_events_images (news_and_events_id, image_url, image_order, created_at) VALUES (?, ?, ?, NOW())",
      [newsAndEventsId, imageUrl, imageOrder]
    );

    const [rows] = await db.execute(
      "SELECT * FROM news_and_events_images WHERE id = ?",
      [result.insertId]
    );

    logger.info(
      `Image added to news and events ${newsAndEventsId}: ${imageUrl}`
    );
    return rows[0];
  } catch (error) {
    logger.error("Error creating news and events image:", error);
    throw error;
  }
};

/**
 * Add multiple images to news and events
 * @param {number} newsAndEventsId - News and Events ID
 * @param {Array} images - Array of image objects {url, order}
 * @returns {Promise<Array>} Array of created image objects
 */
module.exports.createMultiple = async (newsAndEventsId, images) => {
  try {
    const createdImages = [];

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const imageObj = await module.exports.create(
        newsAndEventsId,
        image.url || image,
        image.order || i
      );
      createdImages.push(imageObj);
    }

    logger.info(
      `Added ${images.length} images to news and events ${newsAndEventsId}`
    );
    return createdImages;
  } catch (error) {
    logger.error(
      "Error creating multiple news and events images:",
      error
    );
    throw error;
  }
};

/**
 * Delete image
 * @param {number} id - Image ID
 * @returns {Promise<boolean>} True if deleted
 */
module.exports.delete = async (id) => {
  try {
    const [result] = await db.execute(
      "DELETE FROM news_and_events_images WHERE id = ?",
      [id]
    );
    return result.affectedRows > 0;
  } catch (error) {
    logger.error("Error deleting news and events image:", error);
    throw error;
  }
};

/**
 * Delete all images for a news and events item
 * @param {number} newsAndEventsId - News and Events ID
 * @returns {Promise<boolean>} True if deleted
 */
module.exports.deleteByNewsAndEventsId = async (newsAndEventsId) => {
  try {
    const [result] = await db.execute(
      "DELETE FROM news_and_events_images WHERE news_and_events_id = ?",
      [newsAndEventsId]
    );
    return result.affectedRows > 0;
  } catch (error) {
    logger.error(
      "Error deleting news and events images by news and events ID:",
      error
    );
    throw error;
  }
};

/**
 * Update image order
 * @param {number} id - Image ID
 * @param {number} imageOrder - New image order
 * @returns {Promise<object>} Updated image object
 */
module.exports.updateOrder = async (id, imageOrder) => {
  try {
    await db.execute(
      "UPDATE news_and_events_images SET image_order = ? WHERE id = ?",
      [imageOrder, id]
    );

    const [rows] = await db.execute(
      "SELECT * FROM news_and_events_images WHERE id = ?",
      [id]
    );
    return rows[0];
  } catch (error) {
    logger.error("Error updating image order:", error);
    throw error;
  }
};

