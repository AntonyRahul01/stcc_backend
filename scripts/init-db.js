/**
 * Database initialization script
 * Run this after setting up your MySQL database
 * Usage: node scripts/init-db.js
 */

require("dotenv").config();
const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");
const logger = require("../utils/logger");

async function initializeDatabase() {
  let connection;

  try {
    // Connect to MySQL server (without database)
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
    });

    logger.info("Connected to MySQL server");

    // Read and execute schema file
    const schemaPath = path.join(__dirname, "../database/schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf8");

    // Split by semicolons and execute each statement
    const statements = schema
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    for (const statement of statements) {
      if (statement) {
        await connection.execute(statement);
      }
    }

    logger.info("Database initialized successfully");
    logger.info(
      "You can now register your first admin using POST /api/admin/register"
    );
  } catch (error) {
    logger.error("Error initializing database:", error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run initialization
initializeDatabase();
