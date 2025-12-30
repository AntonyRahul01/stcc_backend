module.exports = {
  apps: [
    {
      name: "stcc-backend",
      script: "./server.js",
      instances: 1, // Use 1 for single instance, or "max" for all CPU cores
      exec_mode: "fork", // Use "fork" for single instance, "cluster" for multiple
      watch: false, // Set to true for development auto-reload
      max_memory_restart: "500M", // Restart if memory exceeds 500MB
      env: {
        NODE_ENV: "development",
        PORT: 4000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 4000,
      },
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      log_file: "./logs/pm2-combined.log",
      time: true, // Prepend timestamp to logs
      merge_logs: true, // Merge logs from all instances
      autorestart: true, // Auto restart on crash
      max_restarts: 10, // Maximum number of restarts
      min_uptime: "10s", // Minimum uptime to consider app stable
      restart_delay: 4000, // Delay between restarts (ms)
      kill_timeout: 5000, // Time to wait before force kill (ms)
    },
  ],
};
