# File Upload Instructions for Postman

## Overview

The API now supports uploading image files directly instead of just URLs. You can upload:

- **Cover Image**: Single image file
- **News Images**: Multiple image files (up to 10)

## Installation

First, install the multer package:

```bash
npm install
```

## How to Upload Files in Postman

### 1. Create News and Events with File Uploads

**Endpoint:** `POST /api/news-and-events`

**Method:** POST

**Headers:**

- `Authorization: Bearer <your-token>`
- `Content-Type: multipart/form-data` (Postman sets this automatically)

**Body Type:** Select `form-data`

**Form Fields:**

- `category_id` (Text): `1`
- `title` (Text): `News Title`
- `description` (Text): `News description`
- `location` (Text): `Location`
- `date_time` (Text): `2024-01-15T10:30:00`
- `status` (Text): `active` (optional, default: active)
- `cover_image` (File): Select a file from your computer
- `images` (File): Select multiple files (hold Ctrl/Cmd to select multiple)

**Note:**

- You can upload files OR provide URLs
- If uploading files, use the `File` type in Postman
- If providing URLs, use the `Text` type and provide JSON array: `["https://example.com/image1.jpg", "https://example.com/image2.jpg"]`

### 2. Update News and Events with File Uploads

**Endpoint:** `PUT /api/news-and-events/:id`

**Method:** PUT

**Headers:**

- `Authorization: Bearer <your-token>`
- `Content-Type: multipart/form-data` (Postman sets this automatically)

**Body Type:** Select `form-data`

**Form Fields:**

- Any fields you want to update (all optional)
- `cover_image` (File): Upload new cover image
- `images` (File): Upload new images (will replace all existing images)

### 3. Using URLs Instead of Files

If you prefer to use URLs instead of uploading files:

**Body Type:** `raw` with `JSON` format

**Example:**

```json
{
  "category_id": 1,
  "title": "News Title",
  "description": "News description",
  "location": "Location",
  "date_time": "2024-01-15T10:30:00",
  "status": "active",
  "cover_image": "https://example.com/cover.jpg",
  "images": ["https://example.com/image1.jpg", "https://example.com/image2.jpg"]
}
```

## File Requirements

- **Supported formats:** JPEG, JPG, PNG, GIF, WEBP
- **Max file size:** 5MB per file
- **Max images:** 10 images per news item
- **Cover image:** Single file

## Accessing Uploaded Images

Uploaded images are accessible via:

```
http://localhost:3000/public/uploads/cover-images/<filename>
http://localhost:3000/public/uploads/news-images/<filename>
```

The API automatically returns the full URL in the response.

## Example Postman Setup

1. **Select POST method**
2. **Enter URL:** `http://localhost:3000/api/news-and-events`
3. **Go to Headers tab:**
   - Add: `Authorization: Bearer <your-jwt-token>`
4. **Go to Body tab:**
   - Select `form-data`
   - Add fields:
     - `category_id` (Text): `1`
     - `title` (Text): `My News Title`
     - `description` (Text): `Description here`
     - `location` (Text): `New York`
     - `date_time` (Text): `2024-01-15T10:30:00`
     - `cover_image` (File): Click "Select Files" and choose an image
     - `images` (File): Click "Select Files" and choose multiple images (hold Ctrl/Cmd)
5. **Click Send**

## Response Format

```json
{
  "success": true,
  "message": "News and events created successfully",
  "data": {
    "newsAndEvents": {
      "id": 1,
      "title": "My News Title",
      "cover_image": "http://localhost:3000/public/uploads/cover-images/cover-1234567890.jpg",
      "images": [
        "http://localhost:3000/public/uploads/news-images/news-1234567890.jpg",
        "http://localhost:3000/public/uploads/news-images/news-1234567891.jpg"
      ],
      ...
    }
  }
}
```
