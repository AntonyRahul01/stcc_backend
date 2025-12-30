const multer = require("multer");
const path = require("path");
const fs = require("fs");
const logger = require("../utils/logger");

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "../public/uploads");
const coverImagesDir = path.join(__dirname, "../public/uploads/cover-images");
const newsImagesDir = path.join(__dirname, "../public/uploads/news-images");

[uploadsDir, coverImagesDir, newsImagesDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    logger.info(`Created upload directory: ${dir}`);
  }
});

// Configure storage for cover images
const coverImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, coverImagesDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `cover-${uniqueSuffix}${ext}`);
  },
});

// Configure storage for news images
const newsImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, newsImagesDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `news-${uniqueSuffix}${ext}`);
  },
});

// File filter for images
const imageFilter = (req, file, cb) => {
  const allowedMimes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only JPEG, JPG, PNG, GIF, and WEBP images are allowed."
      ),
      false
    );
  }
};

// Multer configuration for cover image (single file)
const uploadCoverImage = multer({
  storage: coverImageStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
}).single("cover_image");

// Multer configuration for news images (multiple files)
const uploadNewsImages = multer({
  storage: newsImageStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 10, // Maximum 10 images
  },
}).array("images", 10);

// Combined multer configuration that accepts both file fields and allows other fields
const uploadFiles = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      if (file.fieldname === "cover_image") {
        cb(null, coverImagesDir);
      } else if (file.fieldname === "images") {
        cb(null, newsImagesDir);
      } else {
        cb(null, uploadsDir);
      }
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      if (file.fieldname === "cover_image") {
        cb(null, `cover-${uniqueSuffix}${ext}`);
      } else {
        cb(null, `news-${uniqueSuffix}${ext}`);
      }
    },
  }),
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
  },
}).fields([
  { name: "cover_image", maxCount: 1 },
  { name: "images", maxCount: 10 },
]);

// Helper function to get relative path for database storage
// Returns format: /cover-images/filename.ext or /news-images/filename.ext
const getRelativePath = (filePath, fileType = "cover") => {
  if (!filePath) return null;

  // If it's already a URL, extract the relative path
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    try {
      const url = new URL(filePath);
      const urlPath = url.pathname;
      // Extract path after /public/uploads/ or /uploads/
      const match = urlPath.match(
        /\/(?:public\/)?uploads\/(cover-images|news-images)\/(.+)$/
      );
      if (match) {
        return `/${match[1]}/${match[2]}`;
      }
      // If it's an external URL, return as is
      return filePath;
    } catch (error) {
      // If URL parsing fails, return as is
      return filePath;
    }
  }

  // If it's already a relative path starting with /, return as is
  if (
    filePath.startsWith("/cover-images/") ||
    filePath.startsWith("/news-images/")
  ) {
    return filePath;
  }

  // Extract filename from path
  const filename = path.basename(filePath);

  // Determine directory based on file type
  if (fileType === "cover") {
    return `/cover-images/${filename}`;
  } else if (fileType === "news") {
    return `/news-images/${filename}`;
  }

  return filePath;
};

// Helper function to get file URL (for responses, not database storage)
const getFileUrl = (req, filePath) => {
  if (!filePath) return null;

  // If it's already a URL, return as is
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    return filePath;
  }

  // Construct URL from file path
  const baseUrl =
    process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;

  // Normalize the path - ensure it starts with /public/uploads/
  let relativePath = filePath.replace(/\\/g, "/");

  // If path doesn't start with /public, add it
  if (!relativePath.startsWith("/public")) {
    // Remove leading slash if present, then add /public/
    relativePath = relativePath.replace(/^\/?/, "/public/");
  }

  // Ensure it starts with /
  if (!relativePath.startsWith("/")) {
    relativePath = "/" + relativePath;
  }

  return `${baseUrl}${relativePath}`;
};

// Helper function to extract filename from URL or relative path
const extractFilenameFromUrl = (url) => {
  if (!url) return null;

  // If it's a relative path like /cover-images/filename.ext or /news-images/filename.ext
  if (url.startsWith("/cover-images/") || url.startsWith("/news-images/")) {
    return path.basename(url);
  }

  // If it's not a URL (already a filename), return as is
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return url;
  }

  try {
    // Extract filename from URL
    const urlPath = new URL(url).pathname;
    const filename = path.basename(urlPath);
    return filename;
  } catch (error) {
    logger.error("Error extracting filename from URL:", error);
    return null;
  }
};

// Helper function to delete file from filesystem
const deleteFile = (fileUrl, fileType = "cover") => {
  return new Promise((resolve, reject) => {
    if (!fileUrl) {
      logger.debug("No file URL provided for deletion");
      resolve(false);
      return;
    }

    logger.debug(`Attempting to delete file: ${fileUrl}, type: ${fileType}`);

    // Skip deletion if it's an external URL (not from our server)
    if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
      // Check if it's a local file URL
      const baseUrl =
        process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
      if (!fileUrl.includes(baseUrl) && !fileUrl.includes("localhost")) {
        // External URL, don't delete
        logger.debug(`Skipping deletion - external URL: ${fileUrl}`);
        resolve(false);
        return;
      }
    }

    const filename = extractFilenameFromUrl(fileUrl);
    if (!filename) {
      logger.warn(`Could not extract filename from URL: ${fileUrl}`);
      resolve(false);
      return;
    }

    logger.debug(`Extracted filename: ${filename}`);

    // Determine directory based on file type
    let fileDir;
    if (fileType === "cover") {
      fileDir = coverImagesDir;
    } else if (fileType === "news") {
      fileDir = newsImagesDir;
    } else {
      fileDir = uploadsDir;
    }

    const filePath = path.join(fileDir, filename);
    logger.debug(`Full file path: ${filePath}`);

    // Check if file exists and delete
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err) {
          logger.error(`Error deleting file ${filePath}:`, err);
          reject(err);
        } else {
          logger.info(`Successfully deleted file: ${filePath}`);
          resolve(true);
        }
      });
    } else {
      logger.warn(`File not found for deletion: ${filePath} (URL: ${fileUrl})`);
      resolve(false);
    }
  });
};

// Helper function to delete multiple files
const deleteFiles = async (fileUrls, fileType = "news") => {
  if (!fileUrls || !Array.isArray(fileUrls) || fileUrls.length === 0) {
    return;
  }

  const deletePromises = fileUrls.map((url) => deleteFile(url, fileType));
  await Promise.allSettled(deletePromises);
};

module.exports = {
  uploadCoverImage,
  uploadNewsImages,
  uploadFiles,
  getFileUrl,
  getRelativePath,
  deleteFile,
  deleteFiles,
  extractFilenameFromUrl,
};
