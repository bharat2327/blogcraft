# BlogCraft — Full-Stack Blog Application

A modern, responsive, and production-quality full-stack blog web application built across five integrated modules:
- **Module 1**: Modern Frontend UI (HTML5, CSS3, Vanilla JavaScript)
- **Module 2**: Express.js REST API Backend with JWT Authentication
- **Module 3**: Database Integration with MongoDB, Mongoose, and Persistent Storage
- **Module 4**: Complete Blog CRUD Operations, Ownership Authorization, Search & Category Filtering
- **Module 5**: Secure Authentication & Author Dashboard (JWT Session Management, Per-User Isolation, User Profile & Stats)

---

# Module 5 — Authentication & Dashboard

## Overview
Module 5 implements secure end-to-end authentication and an isolated author dashboard. It enforces cryptographic token verification, server-side per-user blog querying (`GET /api/blogs/my`), draft isolation across accounts, author profile customization, session expiration handling, and clear logout behavior.

## Core Features
- **Secure JWT Authentication**:
  - Signs industry-standard JSON Web Tokens (24-hour expiration policy) with HMAC SHA-256 using `JWT_SECRET` loaded from environment variables.
  - Password hashing with salted `bcryptjs` (cost factor 10) in Mongoose pre-save middleware. Plaintext passwords and hashes are never exposed in API payloads.
  - Constant-time verification on server-side protected endpoints via `verifyToken` middleware.
  - Generic authentication failure responses (`"Invalid email or password."`) to eliminate user enumeration vectors.
- **Server-Enforced Dashboard Protection**:
  - Dedicated private endpoint: `GET /api/blogs/my` strictly authenticated with Bearer token.
  - Rejects unauthenticated requests (HTTP 401), invalid tokens (HTTP 401), and expired tokens (HTTP 401).
  - Client identity is derived exclusively from the verified server-side token (`req.user.id`), never trusting client-supplied IDs.
- **Strict Per-User Blog Isolation**:
  - Dashboard queries MongoDB filtered strictly by `author: req.user.id`.
  - Author A can never view, update, or delete Author B's articles or private drafts.
  - Real-time aggregation of author-specific publication metrics: Total Articles, Published Articles, and Drafts.
- **Author Profile Management**:
  - Profile inspection via `GET /api/auth/me` and `GET /api/auth/profile` returning name, email, member since timestamp (`createdAt`), and author publication stats.
  - Profile update via `PUT /api/auth/profile` allowing authors to safely update their full name.
  - Privilege escalation guard: attempts to alter role, email, password, or `_id` are strictly ignored on the server.
- **Logout & Session Lifecycle**:
  - Prominent logout buttons in the sidebar and top navigation clear all authentication tokens and client credentials.
  - Automated session-expiration detection: when protected requests encounter 401, client credentials are wiped and the user is redirected to `login.html?sessionExpired=true` with a clear warning alert.
  - *Stateless JWT Architecture Note*: Tokens are stateless; logging out clears the client storage token. For production environments requiring immediate revocation of compromised tokens before expiration, a token blocklist or Redis session store can be layered on top of this foundation.

## REST API Endpoints

| Method | Endpoint | Protection | Description |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/health` | Public | Server health & MongoDB database connection status (`database: "connected"`) |
| **POST** | `/api/auth/register` | Public | Register new author with salted bcrypt password hashing |
| **POST** | `/api/auth/login` | Public | Authenticate against MongoDB and issue signed 24h JWT token |
| **GET** | `/api/auth/me` | Protected (`Bearer <token>`) | Retrieve current author profile, registration date, and publication statistics |
| **GET** | `/api/auth/profile` | Protected (`Bearer <token>`) | Alias to `/api/auth/me` for profile modal |
| **PUT** | `/api/auth/profile` | Protected (`Bearer <token>`) | Safely update author profile name (strictly protects privileged fields) |
| **GET** | `/api/blogs/my` | Protected (`Bearer <token>`) | Retrieve only the authenticated author's published & draft blogs with stats |
| **GET** | `/api/blogs` | Public (Optional JWT) | Get published blogs from MongoDB feed. Supports `?search`, `?category`, `?status`. Protects unowned drafts |
| **GET** | `/api/blogs/:id` | Public (Optional JWT) | Retrieve individual blog by MongoDB ObjectId. Protects private drafts |
| **POST** | `/api/blogs` | Protected (`Bearer <token>`) | Create a new blog post or draft linked to authenticated author |
| **PUT** | `/api/blogs/:id` | Protected (`Bearer <token>`) | Update own blog post or publish draft (enforces 403 on non-owners) |
| **DELETE** | `/api/blogs/:id` | Protected (`Bearer <token>`) | Delete own blog post (enforces 403 on non-owners) |

---

# Module 4 — CRUD Operations

- **Create**: Authenticated authors publish articles or save private drafts via `POST /api/blogs`. Validates `title`, `category`, `description`, `content`, and status (`draft` | `published`).
- **Read (All Blogs)**: Public feed retrieves published blogs from MongoDB. Authenticated authors can also view their own drafts in their dashboard.
- **Read (Individual Details)**: Dedicated standalone page (`blog.html?id=<BLOG_ID>`) fetches single blog details via `GET /api/blogs/:id`. Unauthorized access to private drafts returns 404.
- **Update**: Authors can edit their own articles and publish drafts via `PUT /api/blogs/:id`. Pre-populates the editor form and persists changes in MongoDB. Modifications by non-authors are rejected with HTTP 403 Forbidden.
- **Delete**: Authors can permanently remove articles via `DELETE /api/blogs/:id` with interactive confirmation modal dialogs. Unauthorized deletion attempts return HTTP 403 Forbidden.
- **Search & Filtering**: Real-time and database-backed search matching title, description, category, and author. Category filtering with active pill toggles, combined multi-factor queries, and friendly empty-state fallbacks with one-click filter resets.
- **Database Indexes**: Compound and text search indexes on MongoDB Blog collection (`{ status: 1, createdAt: -1 }`, `{ category: 1, status: 1 }`, `{ author: 1 }`, `{ title: 'text', description: 'text' }`).

---

# Module 3 — Database Integration

- **Database**: MongoDB with Mongoose ODM.
- Supports standalone local MongoDB, MongoDB Atlas via `MONGODB_URI`, and includes an embedded local persistent storage engine (`mongodb-memory-server`) for zero-configuration testing and evaluation.

---

# Module 2 — Backend Architecture

- Express.js modular REST API with separate routers and controllers.
- Bearer token verification middleware and centralized error handling.
- CORS configuration supporting dev server and browser origins.

---

# Module 1 — Frontend Blog UI

- Responsive layout (desktop, tablet, mobile) with accessible mobile navigation.
- Curated design system: typography with *Plus Jakarta Sans*, sleek dark-mode accents, glassmorphic styling, and micro-animations.
- Interactive author dashboard with publication counters, responsive table, and live search.
- Standalone reading view (`blog.html`) and quick-read modal preview.
- Non-blocking accessible toast notification system.

---

## Automated Test Suites (110 Total Tests)

Run the full automated test suite:
```bash
cd backend
npm test
```

This sequentially executes:
1. **Module 3 Suite (`test-module3.js`)**: Health checks, database connection, user registration, bcrypt password hashing, login, blog creation, and data persistence.
2. **Module 4 Suite (`test-module4.js` - 47 Tests)**: Full CRUD operations, ownership verification, private drafts, search, category filtering, combined filtering, and persistence.
3. **Module 5 Suite (`test-module5.js` - 63 Tests)**:
   - Valid registration & bcrypt verification
   - Duplicate email rejection (409 Conflict)
   - Successful login with signed JWT issuance
   - Invalid login rejection & generic error messages
   - Missing token rejection on `/api/blogs/my` (401)
   - Forged/invalid token rejection (401)
   - Expired token rejection (401)
   - Protected dashboard API (`GET /api/blogs/my`)
   - Account A sees only Account A's blogs & drafts
   - Account B sees only Account B's blogs & drafts
   - Account A cannot read Account B's private drafts (404)
   - Account A cannot update Account B's blog (403 Forbidden)
   - Account A cannot delete Account B's blog (403 Forbidden)
   - User profile inspection with `createdAt` and statistics
   - User profile update restricting privileged fields
   - Client logout and credential absence handling
   - Server-side authorization enforcement across all protected endpoints
   - Full regression suite for Module 1–4 capabilities

Run individual test suites:
```bash
npm run test:m5   # Module 5 tests only
npm run test:m4   # Module 4 tests only
```

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
Default `.env` configuration:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/blog_application
JWT_SECRET=replace-with-a-secure-secret
CLIENT_ORIGIN=http://localhost:8080
```

### 3. Start Backend Server
```bash
cd backend
npm start
```
Server runs at `http://localhost:5000`. Health check: `http://localhost:5000/api/health`.

### 4. Run Automated Tests
```bash
cd backend
npm test
```

### 5. Start Frontend
From the root project directory:
```bash
# Using Python:
python -m http.server 8080

# Or using Node.js:
npx serve . -p 8080
```

Access in browser:
- Home Page: `http://localhost:8080/index.html`
- Sign In: `http://localhost:8080/login.html`
- Register: `http://localhost:8080/register.html`
- Author Dashboard: `http://localhost:8080/dashboard.html`
- Create / Edit Blog: `http://localhost:8080/create-blog.html`
- Standalone Blog Post: `http://localhost:8080/blog.html?id=<BLOG_ID>`

---

## Author & Repository

- **Developer:** Bharat
- **Repository:** https://github.com/bharat2327/blogcraft.git
