# BlogCraft — Full-Stack Blog Application

A modern, responsive, and production-quality full-stack blog web application built across three integrated modules:
- **Module 1**: Modern Frontend UI (HTML5, CSS3, Vanilla JavaScript)
- **Module 2**: Express.js REST API Backend with JWT Authentication
- **Module 3**: Database Integration with MongoDB, Mongoose, and Persistent Storage

---

# Module 3 — Database Integration

## Database

**MongoDB** (using **Mongoose** ODM)

Persistent database storage is fully implemented for all user accounts and blog posts. An embedded persistent storage engine is provided for immediate zero-configuration local runs, seamlessly connecting to standalone MongoDB or MongoDB Atlas via environment variables.

## Technologies

- **Node.js** (v26.5.0)
- **Express.js** (v4.21.2)
- **MongoDB**
- **Mongoose** (v9.11.0)
- **JWT (jsonwebtoken)** (v9.0.2)
- **bcryptjs** (v2.4.3)
- **HTML5**
- **CSS3**
- **JavaScript (ES6+)**

## Features

- **MongoDB User Storage**: User accounts stored in MongoDB with validated unique email constraints and timestamping.
- **Secure Password Hashing**: Passwords are salted and hashed using `bcryptjs` before storage; hashes are never exposed in responses or stored in frontend.
- **MongoDB Blog Storage**: Full blog documents stored in MongoDB with schema validation and Mongoose `ObjectId` references associating posts with authors.
- **REST APIs**: Full suite of RESTful API endpoints communicating via JSON.
- **Blog Listing**: Dynamic retrieval and display of blogs from MongoDB with author population.
- **Individual Blog Details**: Dedicated standalone article page (`blog.html?id=<BLOG_ID>`) rendering full content, author info, publication date, and read time.
- **Blog CRUD**: Create, Read, Update, and Delete blog posts backed by MongoDB with 403 Forbidden ownership protection.
- **JWT Authentication**: Secure stateless token issuance and verification via Bearer token middleware.
- **Persistent Data**: Data remains fully intact across server restarts.

## API Endpoints

| Method | Endpoint | Protection | Description |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/health` | Public | Health check verifying Express server and MongoDB database status (`database: "connected"`) |
| **POST** | `/api/auth/register` | Public | Register new user in MongoDB with hashed password and return safe user data & JWT |
| **POST** | `/api/auth/login` | Public | Authenticate against MongoDB using bcrypt and return JWT token |
| **GET** | `/api/blogs` | Public | Retrieve all blogs from MongoDB (supports `?category`, `?search`, `?status`, `?authorId`) |
| **GET** | `/api/blogs/:id` | Public | Retrieve individual blog details by MongoDB ObjectId |
| **POST** | `/api/blogs` | Protected (`Bearer <token>`) | Create a new blog post in MongoDB associated with the authenticated user |
| **PUT** | `/api/blogs/:id` | Protected (`Bearer <token>`) | Update own blog post in MongoDB (enforces ownership) |
| **DELETE** | `/api/blogs/:id` | Protected (`Bearer <token>`) | Delete own blog post from MongoDB (enforces ownership) |

## Database Setup

Configure environment variables in `backend/.env` (use `backend/.env.example` as a template):

```env
# MongoDB Connection String (defaults to local MongoDB instance)
MONGODB_URI=mongodb://127.0.0.1:27017/blog_application

# Secret key for signing JWT tokens
JWT_SECRET=super-secret-jwt-key-blogcraft-2026

# Server Port
PORT=5000

# Client Origin for CORS
CLIENT_ORIGIN=http://localhost:8080
```

## How To Run

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment Variables
```bash
cp .env.example .env
```

### 3. Start the Backend Server (Express + MongoDB)
```bash
cd backend
npm start
```
The server connects to MongoDB and starts listening at `http://localhost:5000`.
Check health: `http://localhost:5000/api/health`

### 4. Run Automated Tests
```bash
cd backend
npm test
```
Executes the comprehensive 31-point test suite covering health, registration, login, JWT validation, blog CRUD, ownership rules, and 404/403 error handling.

### 5. Start the Frontend
From the root project directory:
```bash
# Using Python:
python -m http.server 8080

# Or using Node.js:
npx serve . -p 8080
```
Open your browser to:
- Home Page: `http://localhost:8080/index.html`
- Individual Blog: `http://localhost:8080/blog.html?id=<BLOG_ID>`
- Dashboard: `http://localhost:8080/dashboard.html`
- Create Post: `http://localhost:8080/create-blog.html`

---

# Module 2 — Backend Development

## Overview
Express.js REST API providing secure routing, controller architecture, middleware for Bearer token validation, centralized error handling, and robust CORS management.

## Key Architectures
- **Architecture**: `backend/config/`, `backend/models/`, `backend/controllers/`, `backend/routes/`, `backend/middleware/`
- **Security**: BCrypt password hashing, JWT stateless authentication, authorization checks on mutations.
- **Seeding**: Automatic demo seed data ensures out-of-the-box readiness for testing.

---

# Module 1 — Frontend Blog Application

## Overview
Interactive, responsive frontend blog user interface featuring:
- **Responsive Layout**: Fluid design for desktop, tablet, and mobile with hamburger navigation.
- **Design System**: Typography using *Plus Jakarta Sans*, sleek dark-mode accents, glassmorphic styling, and micro-animations.
- **Discovery**: Dynamic search filtering, category pills, featured article spotlight, quick-read modal preview.
- **Author Dashboard**: Statistics metrics, table of author's posts with draft/published badges, view/edit/delete actions.
- **Individual Article Page**: Dedicated article reader (`blog.html`) displaying hero image, author metadata, reading time, and formatted article body.
- **Notifications**: Accessible non-blocking toast alerts.

---

## Project Structure

```text
module-1-frontend-blog/
│
├── index.html                # Public homepage with search, category filters, and blog grid
├── blog.html                 # Dedicated individual blog details page (Module 3)
├── login.html                # Authentication login page
├── register.html             # User registration page
├── dashboard.html            # Protected author dashboard with stats & post management
├── create-blog.html          # Article creator & editor
│
├── css/
│   └── style.css             # Unified modern CSS design system
│
├── js/
│   ├── main.js               # Common utilities, API client, toast notifications
│   ├── auth.js               # User auth, registration, login, logout, route protection
│   ├── blog.js               # Blog data retrieval from MongoDB, card rendering, filters
│   └── dashboard.js          # Dashboard analytics, user posts table, delete confirmation
│
├── backend/
│   ├── server.js             # Express application & database startup
│   ├── package.json          # Dependencies & scripts ("start", "dev", "test")
│   ├── .env.example          # Template for environment configuration
│   ├── config/
│   │   └── database.js       # MongoDB Mongoose connection manager
│   ├── models/
│   │   ├── User.js           # Mongoose User model with bcrypt hashing
│   │   └── Blog.js           # Mongoose Blog model with author reference
│   ├── controllers/
│   │   ├── auth.controller.js# Authentication logic (register, login, JWT)
│   │   └── blog.controller.js# Blog CRUD logic with MongoDB queries & ownership
│   ├── routes/
│   │   ├── auth.routes.js    # Auth routing
│   │   └── blog.routes.js    # Blog routing
│   ├── middleware/
│   │   └── auth.middleware.js# JWT Bearer authentication middleware
│   └── test-module3.js       # Automated end-to-end integration test suite
│
├── README.md                 # Complete project documentation
└── .gitignore                # Excludes node_modules, .env, and local database files
```

---

## Author & Repository

- **Developer:** Bharat
- **Repository:** https://github.com/bharat2327/blogcraft.git
