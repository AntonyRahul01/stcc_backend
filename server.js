require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const logger = require("./utils/logger");
const routes = require("./routes");
const { errorHandler, notFound } = require("./middleware/errorHandler");

// Initialize Express app
const app = express();

// CORS configuration - hardcoded origins (not from .env)
const allowedOrigins = [
  "http://localhost:5173",
  "http://192.168.1.2:5173",
  "http://16.170.44.123:3000",
  "http://localhost:3000",
  "http://192.168.1.2:3000",
  "http://16.170.44.123:4000",
  "https://tccswiss.org",
  "https://www.tccswiss.org",
];

// Simple CORS configuration
const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200,
};

// Apply CORS to all routes - must be before other middleware
app.use(cors(corsOptions));

// Security middleware (configured to allow static file access)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
  })
);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploaded images) - CORS is handled by cors middleware above
app.use("/public", express.static(path.join(__dirname, "public")));

// HTTP request logger
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
} else {
  app.use(
    morgan("combined", {
      stream: {
        write: (message) => logger.info(message.trim()),
      },
    })
  );
}

// Routes
app.use("/api", routes);

// Root route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "STCC Backend API",
    version: "1.0.0",
    endpoints: {
      health: "/api/health",
      admin: {
        login: "POST /api/admin/login",
        register: "POST /api/admin/register",
        profile: "GET /api/admin/profile",
        updateProfile: "PUT /api/admin/profile",
        allAdmins: "GET /api/admin/all",
      },
      categories: {
        getAll: "GET /api/categories",
        getById: "GET /api/categories/:id",
        create: "POST /api/categories (Auth required)",
        update: "PUT /api/categories/:id (Auth required)",
        delete: "DELETE /api/categories/:id (Auth required)",
      },
      newsAndEvents: {
        getAll: "GET /api/news-and-events",
        getById: "GET /api/news-and-events/:id",
        create: "POST /api/news-and-events (Auth required)",
        update: "PUT /api/news-and-events/:id (Auth required)",
        delete: "DELETE /api/news-and-events/:id (Auth required)",
      },
    },
  });
});

// 404 handler
app.use(notFound);

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
});

module.exports = app;
