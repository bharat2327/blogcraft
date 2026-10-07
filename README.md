# BlogCraft — Full-Stack Blog Application

A modern, responsive, and production-quality full-stack blog web application built across four integrated modules:
- **Module 1**: Modern Frontend UI (HTML5, CSS3, Vanilla JavaScript)
- **Module 2**: Express.js REST API Backend with JWT Authentication
- **Module 3**: Database Integration with MongoDB, Mongoose, and Persistent Storage
- **Module 4**: Complete Blog CRUD Operations, Ownership Authorization, Search & Category Filtering

---

# Module 4 — CRUD Operations

## Overview
Module 4 delivers full **CRUD (Create, Read, Update, Delete)** capabilities backed by MongoDB with strict JWT authorization, author ownership verification, private draft lifecycle management, and indexed search and category filtering.

## Features
- **Create**: Authenticated authors publish articles or save private drafts via `POST /api/blogs`. Validates `title`, `category`, `description`, `content`, and status (`draft` | `published`).
- **Read (All Blogs)**: Public feed retrieves published blogs from MongoDB. Authenticated authors can also view their own drafts in their dashboard.
- **Read (Individual Details)**: Dedicated standalone page (`blog.html?id=<BLOG_ID>`) fetches single blog details via `GET /api/blogs/:id`. Unauthorized access to private drafts returns 404.
- **Update**: Authors can edit their own articles and publish drafts via `PUT /api/blogs/:id`. Pre-populates the editor form and persists changes in MongoDB. Modifications by non-authors are rejected with HTTP 403 Forbidden.
- **Delete**: Authors can permanently remove articles via `DELETE /api/blogs/:id` with interactive confirmation modal dialogs. Unauthorized deletion attempts return HTTP 403 Forbidden.
- **Search & Filtering**: Real-time and database-backed search matching title, description, category, and author. Category filtering with active pill toggles, combined multi-factor queries, and friendly empty-state fallbacks with one-click filter resets.
- **Database Indexes**: Compound and text search indexes on MongoDB Blog collection (`{ status: 1, createdAt: -1 }`, `{ category: 1, status: 1 }`, `{ author: 1 }`, `{ title: 'text', description: 'text' }`).

## REST API Endpoints

| Method | Endpoint | Protection | Description |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/health` | Public | Server health & MongoDB database connection status (`database: "connected"`) |
| **POST** | `/api/auth/register` | Public | Register new author with salted bcrypt password hashing |
| **POST** | `/api/auth/login` | Public | Authenticate against MongoDB and issue signed JWT token |
| **GET** | `/api/blogs` | Public (Optional JWT) | Get blogs from MongoDB. Supports `?search`, `?category`, `?status`, `?authorId`. Protects unowned drafts |
| **GET** | `/api/blogs/:id` | Public (Optional JWT) | Retrieve individual blog by MongoDB ObjectId. Protects private drafts |
| **POST** | `/api/blogs` | Protected (`Bearer <token>`) | Create a new blog post or draft linked to authenticated author |
| **PUT** | `/api/blogs/:id` | Protected (`Bearer <token>`) | Update own blog post or publish draft (enforces 403 on non-owners) |
| **DELETE** | `/api/blogs/:id` | Protected (`Bearer <token>`) | Delete own blog post (enforces 403 on non-owners) |

## Automated Testing Suite (47 Tests)
Run the full test suite in `backend/`:
```bash
npm test
```
Executes both Module 3 and Module 4 suites covering:
1. Authenticated blog creation
2. Unauthenticated create rejection (401)
3. Read all published blogs
4. Read individual blog by ObjectId
5. Read nonexistent blog (404)
6. Edit own blog (200)
7. Reject editing another user's blog (403 Forbidden)
8. Delete own blog (200)
9. Reject deleting another user's blog (403 Forbidden)
10. Save draft (`status: draft` & privacy verification)
11. Publish draft (status updated to published and made public)
12. Search blogs by keyword query (`?search=...`)
13. Filter by category (`?category=...`)
14. Combined search and category filtering
15. Database persistence across operations
16. Frontend CRUD contract validation
17. Foundation regression checks (health, registration, duplicate checks, login, bcrypt, JWT)

---

# Module 3 — Database Integration

## Database
**MongoDB** with **Mongoose** ODM.
Supports standalone MongoDB, MongoDB Atlas via `MONGODB_URI`, and includes an embedded local persistent storage engine for zero-configuration testing.

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

---

# Module 2 — Backend Development

## Overview
Express.js REST API providing modular routing, controller architecture, Bearer token middleware, centralized error handling, and CORS management.

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

## How To Run Locally

### 1. Install Backend Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment Variables
```bash
cp .env.example .env
```

### 3. Start Backend Server
```bash
cd backend
npm start
```
Server runs at `http://localhost:5000`. Health check: `http://localhost:5000/api/health`.

### 4. Run Automated Test Suites
```bash
cd backend
npm test
```

### 5. Start the Frontend
From the root repository directory:
```bash
# Using Python:
python -m http.server 8080

# Or using Node.js:
npx serve . -p 8080
```
Open in browser:
- Home: `http://localhost:8080/index.html`
- Individual Blog: `http://localhost:8080/blog.html?id=<BLOG_ID>`
- Dashboard: `http://localhost:8080/dashboard.html`
- Create Post: `http://localhost:8080/create-blog.html`

---

## Author & Repository

- **Developer:** Bharat
- **Repository:** https://github.com/bharat2327/blogcraft.git
