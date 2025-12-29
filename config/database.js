const mysql = require("mysql2/promise");
const logger = require("../utils/logger");

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "stcc_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// Test database connection
pool
  .getConnection()
  .then((connection) => {
    logger.info("MySQL database connected successfully");
    connection.release();
  })
  .catch((err) => {
    logger.error("Database connection error:", err);
    process.exit(1);
  });

module.exports = pool;
