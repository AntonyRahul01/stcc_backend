# Authentication Test Guide

## Testing Authentication

To verify authentication is working, test these protected routes **WITHOUT** a token:

### Protected Routes (Should return 401):

1. **GET /api/categories** (without token)
   - Should return: `401 Unauthorized`
   - Message: "No token provided. Authorization header required."

2. **POST /api/categories** (without token)
   - Should return: `401 Unauthorized`

3. **PUT /api/categories/:id** (without token)
   - Should return: `401 Unauthorized`

4. **DELETE /api/categories/:id** (without token)
   - Should return: `401 Unauthorized`

5. **POST /api/news-and-events** (without token)
   - Should return: `401 Unauthorized`

6. **PUT /api/news-and-events/:id** (without token)
   - Should return: `401 Unauthorized`

7. **DELETE /api/news-and-events/:id** (without token)
   - Should return: `401 Unauthorized`

8. **GET /api/admin/profile** (without token)
   - Should return: `401 Unauthorized`

### Public Routes (Should work without token):

1. **GET /api/categories/user/** - Public route
2. **GET /api/news-and-events** - Public route
3. **GET /api/news-and-events/:id** - Public route
4. **POST /api/admin/login** - Public route
5. **POST /api/admin/register** - Public route

## How to Test in Postman:

1. **Test Protected Route WITHOUT Token:**
   - Method: `POST`
   - URL: `http://localhost:3000/api/categories`
   - Headers: (Don't add Authorization header)
   - Body: 
     ```json
     {
       "name": "Test",
       "slug": "test"
     }
     ```
   - **Expected:** 401 Unauthorized

2. **Test Protected Route WITH Token:**
   - Method: `POST`
   - URL: `http://localhost:3000/api/categories`
   - Headers:
     - `Authorization: Bearer <your-token>`
     - `Content-Type: application/json`
   - Body: Same as above
   - **Expected:** 201 Created

## If Authentication is NOT Working:

Check:
1. Is the route using `authenticate` middleware?
2. Is the middleware imported correctly?
3. Is the middleware placed before the controller?
4. Check server logs for authentication warnings

