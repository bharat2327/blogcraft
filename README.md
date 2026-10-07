# BlogCraft — Full-Stack Blog Application (Modules 1 & 2)

A modern, responsive, and production-quality full-stack blog web application built with semantic **HTML5**, modern **CSS3**, **Vanilla JavaScript (ES6+)**, and a robust **Node.js + Express.js REST API** backend with JWT authentication and bcrypt password hashing.

---

# Module 2 — Backend Development

## Backend Technologies

- **Node.js** (v26.5.0)
- **Express.js** (v4.21.2)
- **REST API Architecture**
- **JWT (jsonwebtoken v9.0.2)** for secure stateless token authentication
- **bcryptjs** (v2.4.3) for cryptographic password hashing
- **CORS** middleware for configured origin communication
- **Local Persistence Layer**: Robust JSON file-based database (`backend/data/users.json` and `backend/data/blogs.json`) with auto-seeding, data validation, and persistence across server restarts.

## API Endpoints

| Method | Endpoint | Protection | Description |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/health` | Public | Server health status check |
| **POST** | `/api/auth/register` | Public | Register new user with hashed password |
| **POST** | `/api/auth/login` | Public | Authenticate user & return JWT token |
| **GET** | `/api/auth/me` | Protected (`Bearer <token>`) | Get current authenticated user profile |
| **GET** | `/api/blogs` | Public | Get all blogs (supports `?category`, `?search`, `?status`, `?authorId`) |
| **GET** | `/api/blogs/:id` | Public | Get a single blog post by ID |
| **POST** | `/api/blogs` | Protected (`Bearer <token>`) | Create a new blog post (published or draft) |
| **PUT** | `/api/blogs/:id` | Protected (`Bearer <token>`) | Update own blog post |
| **DELETE** | `/api/blogs/:id` | Protected (`Bearer <token>`) | Delete own blog post |

## How To Run

### 1. Install Backend Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment
A `.env.example` file is included in the `backend/` folder:
```text
PORT=5000
JWT_SECRET=super-secret-jwt-key-blogcraft-2026
CLIENT_ORIGIN=http://localhost:8080
```
Copy or create `.env`:
```bash
cp .env.example .env
```

### 3. Start Backend Server
```bash
# From the backend directory:
npm start
# Server starts at: http://localhost:5000
# Health check: http://localhost:5000/api/health
```

### 4. Open Frontend
From the root directory:
```bash
# Using Python:
python -m http.server 8080

# Or using Node.js:
npx serve . -p 8080
```
Open your browser and navigate to:
```text
http://localhost:8080/index.html
```

---

# Module 1 — Frontend Blog Application

## Overview

**BlogCraft** is an interactive, responsive blogging platform developed across **Module 1 (Frontend)** and extended in **Module 2 (Backend)**. It simulates a modern publication platform featuring user authentication, session-protected author dashboards, dynamic article creation, live image previews, instant search filtering, and custom non-blocking toast notifications.

## Features

- **Responsive Blog UI**: Fluid grid and flexbox design optimized for mobile, tablet, laptop, and desktop viewports with a collapsible hamburger navigation menu.
- **Modern Typography & Styling**: Custom design system using Google Font *Plus Jakarta Sans*, sleek dark/light color tokens, smooth card hover micro-interactions, and accessible contrast ratios.
- **Full-Stack Authentication**:
  - Author Registration connected to `POST /api/auth/register`.
  - Secure Login connected to `POST /api/auth/login` storing JWT in `localStorage`.
  - Route protection guarding the author dashboard and article editor.
  - Dynamic navbar greeting and one-click logout action.
- **Interactive Author Dashboard**:
  - Real-time statistics tracking **Total Articles**, **Published Articles**, and **Saved Drafts**.
  - Dynamic blog management table with thumbnail previews, category pills, status badges (*Published* in green, *Draft* in amber), and quick action buttons.
  - Search filter within the dashboard.
- **Article Publishing & Management (CRUD)**:
  - **Create**: Add posts with title, category selector, featured image URL, live image preview box, 4 quick preset image pickers, description, and multi-paragraph article content (`POST /api/blogs`).
  - **Draft vs. Publish**: Dual submission buttons to either publish live immediately or save privately as a draft.
  - **Read**: Full-screen interactive reader modal to read articles with complete formatting without leaving the page (`GET /api/blogs/:id`).
  - **Update**: Edit existing articles via `create-blog.html?edit=[id]` (`PUT /api/blogs/:id`).
  - **Delete**: Custom modal confirmation dialog to safely remove posts (`DELETE /api/blogs/:id`).
- **Homepage Discovery**:
  - Spotlight Featured Story hero banner.
  - Real-time search input matching titles, summaries, categories, and author names.
  - Interactive category filter pills (*All Topics*, *CSS & Styling*, *JavaScript*, *UI/UX Design*, *Accessibility*, *Performance*, *Web Development*).
- **Polished UI/UX & Notifications**:
  - Non-blocking custom Toast notification component (`success`, `error`, `warning`, `info`).

## Frontend Technologies

- **HTML5**: Semantic elements (`<header>`, `<nav>`, `<main>`, `<article>`, `<aside>`, `<section>`, `<footer>`).
- **CSS3**: Custom Properties (CSS variables), Flexbox, CSS Grid, Media Queries, glassmorphic backdrop filters, and custom CSS animations.
- **Vanilla JavaScript (ES6+)**: Modular client code with native `fetch()` calls communicating with the Express backend.

---

## Project Structure

```text
module-1-frontend-blog/
│
├── frontend files:
│   ├── index.html            # Public home page with search, filters, featured & recent blogs
│   ├── login.html            # Sign-in page with validation and demo auto-fill
│   ├── register.html         # Registration page with password confirmation
│   ├── dashboard.html        # Protected author dashboard with stats & blog table
│   ├── create-blog.html      # Article creator & editor with live image preview
│   ├── css/
│   │   └── style.css         # Complete modern design system and responsive layout
│   ├── js/
│   │   ├── main.js           # Core utilities, API fetch client, toasts, dynamic navbar
│   │   ├── auth.js           # User registration, login, logout, and route guards
│   │   ├── blog.js           # Blog CRUD client, home grid, instant search, reading modal
│   │   └── dashboard.js      # Dashboard analytics, table rendering, delete modal, form handlers
│   └── assets/
│       └── images/
│           └── logo.svg      # Vector brand icon
│
├── backend/                  # Module 2 Express Backend
│   ├── server.js             # Express application & CORS configuration
│   ├── package.json          # Dependencies & scripts
│   ├── .env.example          # Environment variable template
│   ├── routes/
│   │   ├── auth.routes.js    # Authentication API routes
│   │   └── blog.routes.js    # Blog CRUD API routes
│   ├── controllers/
│   │   ├── auth.controller.js# Auth logic (register, login, JWT)
│   │   └── blog.controller.js# Blog logic (CRUD operations & ownership)
│   ├── middleware/
│   │   └── auth.middleware.js# JWT Bearer token authentication middleware
│   ├── models/
│   │   ├── user.model.js     # User data access layer with bcrypt hashing
│   │   └── blog.model.js     # Blog data access layer with filtering
│   └── data/
│       ├── users.json        # Persistent user records
│       └── blogs.json        # Persistent blog records
│
├── README.md                 # Complete project documentation
└── .gitignore                # Git exclusions (.env, node_modules, caches)
```

---

## Testing

A pre-configured demo author account is automatically seeded:

- **Email:** `demo@example.com`
- **Password:** `password123`

### Verification Checklist:
- [x] **Backend Health Check:** `GET /api/health` returns status 200.
- [x] **Auth Endpoints:** `POST /api/auth/register`, `POST /api/auth/login`, and duplicate checks verified.
- [x] **Blog Endpoints:** `GET /api/blogs`, `POST /api/blogs` (protected), `PUT /api/blogs/:id`, `DELETE /api/blogs/:id` verified.
- [x] **Backend Persistence:** Data verified persistent across server restarts.
- [x] **Frontend Home Page:** Search articles, filter by category pills, open reader modal.
- [x] **Frontend Authentication:** Register new users, log in, receive JWT token, view navbar greeting.
- [x] **Dashboard Protection:** Accessing `dashboard.html` without login automatically redirects to `login.html`.
- [x] **Blog Management:** Create, publish, save draft, edit, and delete articles connected directly to Express backend.

---

## Author

- **Developer:** Bharat
- **Repository:** https://github.com/bharat2327/blogcraft.git
