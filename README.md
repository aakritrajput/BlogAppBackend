# BlogApp Backend

This is the **backend** for BlogApp, a blogging platform that allows users to create, read, update, and delete blog posts. It includes user authentication, media uploads, and email verification.

## 🚀 Tech Stack
- **Backend Framework**: Express.js
- **Database**: MongoDB (with Mongoose ODM)
- **Authentication**: JWT (JSON Web Token)
- **File Uploads**: Cloudinary & Multer
- **Security**: bcrypt for password hashing
- **Email Service**: Nodemailer
- **Other Dependencies**: CORS, dotenv, cookie-parser

## 🔗 API Documentation
For full API documentation and testing, visit the following Postman collection:

[📖 View API Documentation](https://aakrit-api-testing.postman.co/workspace/Aakrit-backend-project-APIs~63cf2ffc-dab8-45ac-bcc3-06607ae6df6f/collection/40642790-30a46636-3932-4f29-8166-dcee01342eb3?action=share&creator=40642790&active-environment=40642790-f69dd501-e3cf-44e8-87d0-8cf7ca386d00)

## 🌐 Deployment
The backend is deployed on **Render**.

## ⚙️ Installation & Setup
### 1️⃣ Clone the repository
```sh
git clone https://github.com/aakritrajput/BlogAppBackend.git
cd BlogAppBackend
```

### 2️⃣ Install dependencies
```sh
npm install
```

### 3️⃣ Configure environment variables
Create a `.env` file in the root directory and add the following:
```env
PORT=
MONGODB_URI=
CORS_ORIGIN=
ACCESS_TOKEN_SECRET=
ACCESS_TOKEN_EXPIRY=
REFRESH_TOKEN_SECRET=
REFRESH_TOKEN_EXPIRY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
VERIFICATION_TOKEN_SECRET=
VERIFICATION_TOKEN_EXPIRY=
PROJECT_OWNER_EMAIL=
PROJECT_OWNER_PASSWORD=
NODE_ENV=
```

### 4️⃣ Start the server
```sh
npm start
```

## 🛠 Features
✅ User authentication (JWT-based)
✅ CRUD operations for blog posts
✅ Image upload using Cloudinary
✅ Email verification via Nodemailer
✅ Pagination using `mongoose-aggregate-paginate-v2`

## 📁 Project Structure
```
BlogAppBackend/
│-- public/       # Stores images locally during upload
│-- src/
│   ├── controllers/  # Business logic for routes
│   ├── routes/       # API route handlers
│   ├── middlewares/  # Middleware functions (auth, error handling)
│   ├── models/       # Mongoose models (User, Post, etc.)
│   ├── utils/        # Helper utilities (email, file upload, etc.)
│   ├── db/           # Database connection setup
│   ├── index.js      # Entry point
│-- .env.example  # Environment variable sample
│-- package.json  # Dependencies and scripts
```

---

### 🎯 Author: [Aakrit Rajput](https://github.com/aakritrajput)

