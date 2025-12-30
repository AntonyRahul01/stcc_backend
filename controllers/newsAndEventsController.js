const NewsAndEvents = require("../models/NewsAndEvents");
const NewsAndEventsImage = require("../models/NewsAndEventsImage");
const Category = require("../models/Category");
const logger = require("../utils/logger");
const { formatResponse } = require("../utils/helpers");
const {
  getFileUrl,
  getRelativePath,
  deleteFile,
  deleteFiles,
} = require("../config/upload");
const path = require("path");

/**
 * Get all news and events
 * GET /api/news-and-events
 * Query params: page, limit, category_id, status, search, date_from, date_to
 */
module.exports.getAllNewsAndEvents = async (req, res, next) => {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Validate pagination
    if (page < 1) {
      return res
        .status(400)
        .json(formatResponse(false, "Page must be greater than 0"));
    }

    if (limit < 1 || limit > 100) {
      return res
        .status(400)
        .json(formatResponse(false, "Limit must be between 1 and 100"));
    }

    const filters = {
      category_id: req.query.category_id,
      status: req.query.status,
      search: req.query.search,
      date_from: req.query.date_from,
      date_to: req.query.date_to,
      limit: limit,
      offset: offset,
    };

    // Get total count for pagination (without limit/offset)
    const totalCount = await NewsAndEvents.count({
      category_id: filters.category_id,
      status: filters.status,
      search: filters.search,
      date_from: filters.date_from,
      date_to: filters.date_to,
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    // Get news and events with pagination
    const newsAndEvents = await NewsAndEvents.findAll(filters);

    // Get images for each news and events item
    const newsAndEventsWithImages = await Promise.all(
      newsAndEvents.map(async (item) => {
        const images = await NewsAndEventsImage.findByNewsAndEventsId(item.id);
        return {
          ...item,
          cover_image: getRelativePath(item.cover_image, "cover"),
          images: images.map((img) => getRelativePath(img.image_url, "news")),
        };
      })
    );

    res.json(
      formatResponse(true, "News and events retrieved successfully", {
        newsAndEvents: newsAndEventsWithImages,
        pagination: {
          currentPage: page,
          totalPages: totalPages,
          totalItems: totalCount,
          itemsPerPage: limit,
          hasNext: hasNext,
          hasPrev: hasPrev,
          nextPage: hasNext ? page + 1 : null,
          prevPage: hasPrev ? page - 1 : null,
        },
      })
    );
  } catch (error) {
    logger.error("Get all news and events error:", error);
    next(error);
  }
};

/**
 * Get all active news and events (public endpoint)
 * GET /api/news-and-events/public
 * Query params: page, limit, category_id, search, date_from, date_to
 * Always returns only items with status='active'
 */
module.exports.getActiveNewsAndEvents = async (req, res, next) => {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Validate pagination
    if (page < 1) {
      return res
        .status(400)
        .json(formatResponse(false, "Page must be greater than 0"));
    }

    if (limit < 1 || limit > 100) {
      return res
        .status(400)
        .json(formatResponse(false, "Limit must be between 1 and 100"));
    }

    // Always filter by active status for public endpoint
    const filters = {
      category_id: req.query.category_id,
      status: "active", // Always active for public endpoint
      search: req.query.search,
      date_from: req.query.date_from,
      date_to: req.query.date_to,
      limit: limit,
      offset: offset,
    };

    // Get total count for pagination (without limit/offset)
    const totalCount = await NewsAndEvents.count({
      category_id: filters.category_id,
      status: filters.status,
      search: filters.search,
      date_from: filters.date_from,
      date_to: filters.date_to,
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    // Get news and events with pagination
    const newsAndEvents = await NewsAndEvents.findAll(filters);

    // Get images for each news and events item
    const newsAndEventsWithImages = await Promise.all(
      newsAndEvents.map(async (item) => {
        const images = await NewsAndEventsImage.findByNewsAndEventsId(item.id);
        return {
          ...item,
          cover_image: getRelativePath(item.cover_image, "cover"),
          images: images.map((img) => getRelativePath(img.image_url, "news")),
        };
      })
    );

    res.json(
      formatResponse(true, "Active news and events retrieved successfully", {
        newsAndEvents: newsAndEventsWithImages,
        pagination: {
          currentPage: page,
          totalPages: totalPages,
          totalItems: totalCount,
          itemsPerPage: limit,
          hasNext: hasNext,
          hasPrev: hasPrev,
          nextPage: hasNext ? page + 1 : null,
          prevPage: hasPrev ? page - 1 : null,
        },
      })
    );
  } catch (error) {
    logger.error("Get active news and events error:", error);
    next(error);
  }
};

/**
 * Get active news and events by ID (public endpoint)
 * GET /api/news-and-events/public/:id
 * Only returns the item if status is 'active'
 */
module.exports.getActiveNewsAndEventsById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const newsAndEvents = await NewsAndEvents.findById(id);

    if (!newsAndEvents) {
      return res
        .status(404)
        .json(formatResponse(false, "News and events not found"));
    }

    // Check if the news and events is active
    if (newsAndEvents.status !== "active") {
      return res
        .status(404)
        .json(formatResponse(false, "News and events not found"));
    }

    // Get images for the news and events item
    const images = await NewsAndEventsImage.findByNewsAndEventsId(id);

    res.json(
      formatResponse(true, "Active news and events retrieved successfully", {
        newsAndEvents: {
          ...newsAndEvents,
          cover_image: getRelativePath(newsAndEvents.cover_image, "cover"),
          images: images.map((img) => getRelativePath(img.image_url, "news")),
        },
      })
    );
  } catch (error) {
    logger.error("Get active news and events by ID error:", error);
    next(error);
  }
};

/**
 * Get news and events by ID
 * GET /api/news-and-events/:id
 */
module.exports.getNewsAndEventsById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const newsAndEvents = await NewsAndEvents.findById(id);

    if (!newsAndEvents) {
      return res
        .status(404)
        .json(formatResponse(false, "News and events not found"));
    }

    // Get images for the news and events item
    const images = await NewsAndEventsImage.findByNewsAndEventsId(id);

    res.json(
      formatResponse(true, "News and events retrieved successfully", {
        newsAndEvents: {
          ...newsAndEvents,
          cover_image: getRelativePath(newsAndEvents.cover_image, "cover"),
          images: images.map((img) => getRelativePath(img.image_url, "news")),
        },
      })
    );
  } catch (error) {
    logger.error("Get news and events by ID error:", error);
    next(error);
  }
};

/**
 * Create a new news and events
 * POST /api/news-and-events
 * Supports both file uploads and URLs
 */
module.exports.createNewsAndEvents = async (req, res, next) => {
  try {
    const { category_id, title, description, location, date_time, status } =
      req.body;

    // Verify category exists
    const category = await Category.findById(category_id);
    if (!category) {
      return res.status(404).json(formatResponse(false, "Category not found"));
    }

    // Handle cover image: uploaded file or URL
    let coverImageUrl = null;
    if (
      req.files &&
      req.files.cover_image &&
      req.files.cover_image.length > 0
    ) {
      // File was uploaded - store relative path in database
      const file = req.files.cover_image[0];
      const filePath = path.join("uploads/cover-images", file.filename);
      coverImageUrl = getRelativePath(filePath, "cover");
    } else if (req.body.cover_image) {
      // URL was provided - convert to relative path if it's a local URL
      coverImageUrl = getRelativePath(req.body.cover_image, "cover");
    }

    // Get created_by from authenticated user
    const created_by = req.user ? req.user.id : null;

    // Create news and events
    const newsAndEvents = await NewsAndEvents.create({
      category_id,
      title,
      description,
      location,
      cover_image: coverImageUrl,
      date_time,
      status,
      created_by,
    });

    // Handle images: uploaded files or URLs
    let imageUrls = [];

    // Check if files were uploaded
    if (req.files && req.files.images && req.files.images.length > 0) {
      // Files were uploaded - store relative paths in database
      imageUrls = req.files.images.map((file) => {
        const filePath = path.join("uploads/news-images", file.filename);
        return getRelativePath(filePath, "news");
      });
    } else if (req.body.images) {
      // URLs were provided (can be string or array) - convert to relative paths
      let providedImages = [];
      if (Array.isArray(req.body.images)) {
        providedImages = req.body.images;
      } else if (typeof req.body.images === "string") {
        // Try to parse if it's a JSON string
        try {
          providedImages = JSON.parse(req.body.images);
        } catch {
          providedImages = [req.body.images];
        }
      }
      // Convert each URL to relative path
      imageUrls = providedImages.map((img) => getRelativePath(img, "news"));
    }

    // Add images if provided
    if (imageUrls.length > 0) {
      await NewsAndEventsImage.createMultiple(newsAndEvents.id, imageUrls);
    }

    // Get the complete news and events with images
    const newsAndEventsImages = await NewsAndEventsImage.findByNewsAndEventsId(
      newsAndEvents.id
    );

    logger.info(`News and events created: ${title} (ID: ${newsAndEvents.id})`);

    res.status(201).json(
      formatResponse(true, "News and events created successfully", {
        newsAndEvents: {
          ...newsAndEvents,
          cover_image: getRelativePath(newsAndEvents.cover_image, "cover"),
          images: newsAndEventsImages.map((img) =>
            getRelativePath(img.image_url, "news")
          ),
        },
      })
    );
  } catch (error) {
    logger.error("Create news and events error:", error);

    // Handle foreign key constraint error
    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json(formatResponse(false, "Invalid category ID"));
    }

    next(error);
  }
};

/**
 * Update news and events
 * PUT /api/news-and-events/:id
 */
module.exports.updateNewsAndEvents = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if news and events exists
    const existingNewsAndEvents = await NewsAndEvents.findById(id);
    if (!existingNewsAndEvents) {
      return res
        .status(404)
        .json(formatResponse(false, "News and events not found"));
    }

    // Verify category if being updated
    if (updateData.category_id) {
      const category = await Category.findById(updateData.category_id);
      if (!category) {
        return res
          .status(404)
          .json(formatResponse(false, "Category not found"));
      }
    }

    // Store old cover image URL for deletion
    const oldCoverImage = existingNewsAndEvents.cover_image;

    // Get old images URLs BEFORE any updates (important!)
    const oldImages = await NewsAndEventsImage.findByNewsAndEventsId(id);
    const oldImageUrls = oldImages.map((img) => img.image_url);

    logger.info(`Update request for news ID ${id}`);
    logger.info(`Old cover image: ${oldCoverImage}`);
    logger.info(
      `Old news images (${oldImageUrls.length}): ${JSON.stringify(
        oldImageUrls
      )}`
    );

    // Handle cover image: uploaded file or URL
    let newCoverImageUrl = null;
    if (
      req.files &&
      req.files.cover_image &&
      req.files.cover_image.length > 0
    ) {
      // File was uploaded - store relative path in database
      const file = req.files.cover_image[0];
      const filePath = path.join("uploads/cover-images", file.filename);
      newCoverImageUrl = getRelativePath(filePath, "cover");

      // Delete old cover image if it exists and is different from new one
      if (oldCoverImage && oldCoverImage !== newCoverImageUrl) {
        logger.info(
          `New cover image uploaded. Deleting old cover image: ${oldCoverImage}`
        );
        try {
          const deleted = await deleteFile(oldCoverImage, "cover");
          if (deleted) {
            logger.info(
              `Successfully deleted old cover image: ${oldCoverImage}`
            );
          } else {
            logger.warn(`Failed to delete old cover image: ${oldCoverImage}`);
          }
        } catch (error) {
          logger.error("Error deleting old cover image:", error);
        }
      }

      updateData.cover_image = newCoverImageUrl;
      logger.info(`New cover image path: ${updateData.cover_image}`);
    } else if (updateData.cover_image !== undefined) {
      // Cover image URL provided in body
      if (updateData.cover_image === "" || updateData.cover_image === null) {
        // Remove cover image - delete old file
        if (oldCoverImage) {
          logger.info(
            `Removing cover image. Deleting old file: ${oldCoverImage}`
          );
          try {
            await deleteFile(oldCoverImage, "cover");
          } catch (error) {
            logger.error("Error deleting old cover image:", error);
          }
        }
        updateData.cover_image = null;
      } else {
        // New cover image URL provided - convert to relative path
        newCoverImageUrl = getRelativePath(updateData.cover_image, "cover");
        // Delete old cover image if it's different from new one
        if (oldCoverImage && oldCoverImage !== newCoverImageUrl) {
          logger.info(
            `Cover image changed. Deleting old cover image: ${oldCoverImage}`
          );
          try {
            await deleteFile(oldCoverImage, "cover");
          } catch (error) {
            logger.error("Error deleting old cover image:", error);
          }
        }
        updateData.cover_image = newCoverImageUrl;
      }
    }

    // Handle images: uploaded files or URLs
    let imageUrls = [];
    let shouldUpdateImages = false;

    // Check if files were uploaded
    if (req.files && req.files.images && req.files.images.length > 0) {
      shouldUpdateImages = true;
      // Files were uploaded - store relative paths in database
      imageUrls = req.files.images.map((file) => {
        const filePath = path.join("uploads/news-images", file.filename);
        return getRelativePath(filePath, "news");
      });
      logger.info(
        `New images uploaded (${imageUrls.length}): ${JSON.stringify(
          imageUrls
        )}`
      );
    } else if (req.body.images !== undefined) {
      shouldUpdateImages = true;
      // URLs were provided or images should be removed
      if (req.body.images === "" || req.body.images === null) {
        imageUrls = [];
      } else {
        let providedImages = [];
        if (Array.isArray(req.body.images)) {
          providedImages = req.body.images;
        } else if (typeof req.body.images === "string") {
          try {
            providedImages = JSON.parse(req.body.images);
          } catch {
            providedImages = [req.body.images];
          }
        }
        // Convert each URL to relative path
        imageUrls = providedImages.map((img) => getRelativePath(img, "news"));
      }
      logger.info(
        `New images from body (${imageUrls.length}): ${JSON.stringify(
          imageUrls
        )}`
      );
    }

    // Remove images from updateData as we handle it separately
    delete updateData.images;

    // Update news and events
    const newsAndEvents = await NewsAndEvents.update(id, updateData);

    // Update images if new images were provided - Smart update logic
    if (shouldUpdateImages) {
      // Compare old and new images to find what to keep, delete, and add
      const imagesToKeep = imageUrls.filter((url) =>
        oldImageUrls.includes(url)
      );
      const imagesToDelete = oldImageUrls.filter(
        (url) => !imageUrls.includes(url)
      );
      const imagesToAdd = imageUrls.filter(
        (url) => !oldImageUrls.includes(url)
      );

      logger.info(`Smart image update for news ID ${id}:`);
      logger.info(
        `- Old images: ${oldImageUrls.length} ${JSON.stringify(oldImageUrls)}`
      );
      logger.info(
        `- New images: ${imageUrls.length} ${JSON.stringify(imageUrls)}`
      );
      logger.info(
        `- Images to keep: ${imagesToKeep.length} ${JSON.stringify(
          imagesToKeep
        )}`
      );
      logger.info(
        `- Images to delete: ${imagesToDelete.length} ${JSON.stringify(
          imagesToDelete
        )}`
      );
      logger.info(
        `- Images to add: ${imagesToAdd.length} ${JSON.stringify(imagesToAdd)}`
      );

      // Delete removed images from database
      if (imagesToDelete.length > 0) {
        for (const urlToDelete of imagesToDelete) {
          const imageToDelete = oldImages.find(
            (img) => img.image_url === urlToDelete
          );
          if (imageToDelete && imageToDelete.id) {
            try {
              await NewsAndEventsImage.delete(imageToDelete.id);
              logger.info(`Deleted image from database: ${urlToDelete}`);
            } catch (error) {
              logger.error(
                `Error deleting image from database: ${urlToDelete}`,
                error
              );
            }
          }
        }

        // Delete removed image files from filesystem
        try {
          logger.info(
            `Deleting ${
              imagesToDelete.length
            } removed images from filesystem: ${JSON.stringify(imagesToDelete)}`
          );
          await deleteFiles(imagesToDelete, "news");
          logger.info(`Finished deleting removed images`);
        } catch (error) {
          logger.error("Error deleting removed images:", error);
        }
      }

      // Add new images to database
      if (imagesToAdd.length > 0) {
        await NewsAndEventsImage.createMultiple(id, imagesToAdd);
        logger.info(`Added ${imagesToAdd.length} new images to database`);
      }

      // If all images were removed (empty array)
      if (imageUrls.length === 0 && oldImageUrls.length > 0) {
        // Already deleted individual images above, but ensure database is clean
        await NewsAndEventsImage.deleteByNewsAndEventsId(id);
        logger.info(`Removed all images`);
      }
    }

    // Get updated news and events with images
    const newsAndEventsImages = await NewsAndEventsImage.findByNewsAndEventsId(
      id
    );

    logger.info(`News and events updated: ID ${id}`);

    res.json(
      formatResponse(true, "News and events updated successfully", {
        newsAndEvents: {
          ...newsAndEvents,
          cover_image: getRelativePath(newsAndEvents.cover_image, "cover"),
          images: newsAndEventsImages.map((img) =>
            getRelativePath(img.image_url, "news")
          ),
        },
      })
    );
  } catch (error) {
    logger.error("Update news and events error:", error);

    // Handle foreign key constraint error
    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json(formatResponse(false, "Invalid category ID"));
    }

    next(error);
  }
};

/**
 * Delete news and events
 * DELETE /api/news-and-events/:id
 */
module.exports.deleteNewsAndEvents = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if news and events exists
    const newsAndEvents = await NewsAndEvents.findById(id);
    if (!newsAndEvents) {
      return res
        .status(404)
        .json(formatResponse(false, "News and events not found"));
    }

    // Get all images before deleting
    const images = await NewsAndEventsImage.findByNewsAndEventsId(id);
    const imageUrls = images.map((img) => img.image_url);

    // Delete cover image if it exists
    if (newsAndEvents.cover_image) {
      try {
        await deleteFile(newsAndEvents.cover_image, "cover");
      } catch (error) {
        logger.error("Error deleting cover image:", error);
      }
    }

    // Delete all news images
    if (imageUrls.length > 0) {
      try {
        await deleteFiles(imageUrls, "news");
      } catch (error) {
        logger.error("Error deleting news images:", error);
      }
    }

    // Delete news and events (images will be deleted automatically from DB due to CASCADE)
    const deleted = await NewsAndEvents.delete(id);

    if (!deleted) {
      return res
        .status(400)
        .json(formatResponse(false, "Failed to delete news and events"));
    }

    logger.info(`News and events deleted: ID ${id}`);

    res.json(formatResponse(true, "News and events deleted successfully"));
  } catch (error) {
    logger.error("Delete news and events error:", error);
    next(error);
  }
};
