# STCC Backend API

A Node.js backend API with MySQL database, following MVC architecture pattern.

## Features

- ✅ Express.js framework
- ✅ MySQL database with connection pooling
- ✅ MVC architecture (Models, Views, Controllers)
- ✅ JWT authentication
- ✅ Winston logger
- ✅ Middleware (authentication, error handling, validation)
- ✅ Admin login and registration
- ✅ Secure password hashing with bcrypt
- ✅ Input validation with express-validator
- ✅ CORS and Helmet for security

## Project Structure

```
stcc_backend/
├── config/
│   └── database.js          # MySQL database configuration
├── controllers/
│   └── adminController.js   # Admin controller
├── middleware/
│   ├── auth.js              # Authentication middleware
│   ├── errorHandler.js      # Error handling middleware
│   └── validation.js        # Input validation middleware
├── models/
│   └── Admin.js             # Admin model
├── routes/
│   ├── adminRoutes.js       # Admin routes
│   └── index.js             # Main routes
├── utils/
│   ├── logger.js            # Winston logger configuration
│   └── helpers.js           # Utility functions
├── database/
│   └── schema.sql           # Database schema
├── logs/                    # Log files (auto-generated)
├── .env.example             # Environment variables example
├── .gitignore
├── package.json
├── README.md
└── server.js                # Main server file
```

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and update the database credentials and JWT secret.

4. Set up the database:
   - Create a MySQL database
   - Run the SQL schema:
     ```bash
     mysql -u root -p < database/schema.sql
     ```
   Or import `database/schema.sql` using your MySQL client.

## Running the Application

### Development mode:
```bash
npm run dev
```

### Production mode:
```bash
npm start
```

The server will start on `http://localhost:3000` (or the port specified in `.env`).

## API Endpoints

### Health Check
- `GET /api/health` - Check server status

### Admin Endpoints

#### Public Routes:
- `POST /api/admin/register` - Register a new admin
  ```json
  {
    "email": "admin@example.com",
    "password": "SecurePass123",
    "name": "Admin Name"
  }
  ```

- `POST /api/admin/login` - Admin login (returns JWT token)
  ```json
  {
    "email": "admin@example.com",
    "password": "SecurePass123"
  }
  ```

#### Protected Routes (require JWT token in Authorization header):
- `GET /api/admin/profile` - Get current admin profile
- `PUT /api/admin/profile` - Update admin profile
- `GET /api/admin/all` - Get all admins

### Authentication

For protected routes, include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Example Usage

### Login:
```bash
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@stcc.com",
    "password": "Admin@123"
  }'
```

### Access Protected Route:
```bash
curl -X GET http://localhost:3000/api/admin/profile \
  -H "Authorization: Bearer <your-jwt-token>"
```

## Environment Variables

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `DB_HOST` - MySQL host
- `DB_USER` - MySQL username
- `DB_PASSWORD` - MySQL password
- `DB_NAME` - Database name
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_EXPIRES_IN` - Token expiration time (default: 24h)
- `CORS_ORIGIN` - CORS allowed origin
- `LOG_LEVEL` - Logging level (default: info)

## Logging

Logs are stored in the `logs/` directory:
- `combined.log` - All logs
- `error.log` - Error logs only

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Input validation
- SQL injection protection (parameterized queries)
- Helmet.js for security headers
- CORS configuration

## License

ISC

