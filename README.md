# BlogCraft — Full-Stack Blog Application

A modern, responsive, production-quality full-stack blog web application built across six integrated modules:
- **Module 1**: Modern Frontend UI (HTML5, CSS3, Vanilla JavaScript)
- **Module 2**: Express.js REST API Backend Architecture
- **Module 3**: Database Integration with MongoDB, Mongoose, and Persistent Storage
- **Module 4**: Complete Blog CRUD Operations, Ownership Authorization, Search & Category Filtering
- **Module 5**: Secure Authentication & Author Dashboard (JWT Session Management, Per-User Isolation, User Profile & Stats)
- **Module 6**: Final Project Optimization, Production Configuration, and Multi-Platform Deployment

---

## 🔗 Repository Links

- **GitHub Repository**: [https://github.com/bharat2327/blogcraft](https://github.com/bharat2327/blogcraft)
- **Live Website**: Configured for Render & Vercel deployment (see Deployment section below)

---

## 🚀 Key Features

### 1. Reader & Public Exploration (Modules 1 & 4)
- **Responsive Magazine UI**: Fluid layout adapted for desktop, laptop, tablet, and mobile with accessible hamburger navigation.
- **Visual Design System**: Custom typography scale (*Plus Jakarta Sans*, *JetBrains Mono*), glassmorphic navbars, micro-animations, and curated Unsplash imagery.
- **Dynamic Discovery**: Real-time client and database-backed keyword search (`?search=`), category filter pills (`?category=`), featured article spotlight, and instant preview modal.
- **Dedicated Article Reader**: Standalone reader view (`blog.html?id=<BLOG_ID>`) with computed reading time, formatted paragraphs, and author attribution.

### 2. Secure Cryptographic Authentication (Modules 2 & 5)
- **Salted Password Hashing**: Utilizes `bcryptjs` (salt cost 10) in Mongoose pre-save hooks. Passwords and hashes are strictly stripped from responses via `toJSON`/`toObject` transforms.
- **HMAC SHA-256 JWTs**: 24-hour expiration tokens signed with environment-loaded `JWT_SECRET`.
- **Constant-Time Verification**: Server-side Bearer token middleware (`verifyToken`) rejecting missing, invalid, and expired tokens with HTTP 401.
- **Enumeration Protection**: Generic authentication failure messaging (`"Invalid email or password."`) to eliminate user enumeration vectors.
- **Session Lifecycle & Route Guarding**: Automated 401 interception that purges client state and triggers friendly redirects (`login.html?sessionExpired=true`).

### 3. Isolated Author Dashboard (Module 5)
- **Dedicated Protected Endpoint**: `GET /api/blogs/my` derives user identity strictly from verified server-side JWT claims (`req.user.id`).
- **Guaranteed Cross-User Isolation**: Author A can never view, mutate, or access private drafts created by Author B.
- **Live Metric Aggregation**: Server-calculated counters for Total Articles, Published Articles, and Saved Drafts.
- **Author Profile Modal**: In-dashboard profile management displaying member registration date (`createdAt`), publication counters, and safe name updating (`PUT /api/auth/profile`) with immutable privileged fields.

### 4. Full CRUD & Ownership Protection (Modules 4 & 5)
- **Create**: Authenticated creation of published articles and private drafts via `POST /api/blogs`.
- **Read**: Public feed filters out unowned drafts while authors manage all their own posts in their private dashboard.
- **Update**: Authors modify their articles and publish drafts via `PUT /api/blogs/:id` (403 Forbidden for non-owners).
- **Delete**: Authors permanently remove articles via `DELETE /api/blogs/:id` with interactive confirmation dialogs (403 Forbidden for non-owners).

---

## 🛠️ Technology Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | HTML5, CSS3, Vanilla JavaScript | Fast, accessible, framework-free client with no bloated dependencies |
| **Design System** | Pure CSS3 (Variables, Flexbox, Grid) | Custom theme tokens, micro-animations, glassmorphism, responsive breakpoints |
| **Backend** | Node.js, Express.js | Modular REST API architecture with controllers, routes, and middleware |
| **Database** | MongoDB & Mongoose ODM | Document storage, validation schemas, population, compound and text search indexes |
| **Local Dev Engine**| `mongodb-memory-server` | Zero-configuration local persistent engine for instant testing without pre-running mongod |
| **Authentication** | `jsonwebtoken` & `bcryptjs` | Stateless Bearer token verification and salted password hashing |
| **Deployment** | Render, Vercel, Netlify | Unified full-stack Express serving and serverless configuration |

---

## 📂 Project Structure

```text
blogcraft/
├── assets/                     # Static media and brand graphics
├── css/
│   └── style.css              # Unified design system & responsive stylesheets
├── js/
│   ├── auth.js                # Authentication, validation, and session lifecycle
│   ├── blog.js                # Blog CRUD data operations and homepage controllers
│   ├── dashboard.js           # Dashboard metrics, article table, and profile modal
│   └── main.js                # Dynamic API client, navbar updates, and toast system
├── api/
│   └── index.js               # Serverless entrypoint for Vercel deployment
├── backend/
│   ├── config/
│   │   └── database.js        # Mongoose connection with Atlas and local fallback
│   ├── controllers/
│   │   ├── auth.controller.js # Auth, login, registration, and profile controllers
│   │   └── blog.controller.js # CRUD, search, filter, and user dashboard controllers
│   ├── middleware/
│   │   └── auth.middleware.js # JWT verification and optional authentication
│   ├── models/
│   │   ├── Blog.js            # Mongoose Blog schema, virtuals, and search indexes
│   │   └── User.js            # Mongoose User schema with pre-save bcrypt hashing
│   ├── routes/
│   │   ├── auth.routes.js     # Modular authentication routes
│   │   └── blog.routes.js     # Modular blog and dashboard routes
│   ├── server.js              # Express app, static serving, and health endpoint
│   ├── test-module3.js        # Module 3 integration tests
│   ├── test-module4.js        # Module 4 CRUD and security tests (47 tests)
│   ├── test-module5.js        # Module 5 authentication & dashboard tests (63 tests)
│   └── package.json           # Backend dependency manifest
├── blog.html                  # Standalone article reader view
├── create-blog.html           # Article writer and draft editor
├── dashboard.html             # Author dashboard with profile modal
├── index.html                 # Homepage with featured spotlight and category filters
├── login.html                 # Sign-in page with demo credentials button
├── register.html              # Author account registration page
├── package.json               # Root manifest for unified full-stack deployment
├── render.yaml                # Render Blueprint deployment specification
├── vercel.json                # Vercel serverless rewrite configuration
└── README.md                  # Comprehensive project documentation
```

---

## 📡 REST API Reference

| Method | Endpoint | Protection | Description |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/health` | Public | Server health & database connectivity status (`database: "connected"`) |
| **POST** | `/api/auth/register` | Public | Register new author with salted bcrypt password hashing |
| **POST** | `/api/auth/login` | Public | Authenticate against MongoDB and issue signed 24h JWT token |
| **GET** | `/api/auth/me` | Protected (`Bearer <token>`) | Current author profile with `createdAt` and live article stats |
| **GET** | `/api/auth/profile` | Protected (`Bearer <token>`) | Author profile endpoint for dashboard profile modal |
| **PUT** | `/api/auth/profile` | Protected (`Bearer <token>`) | Update author name (strictly preserves immutable privileged fields) |
| **GET** | `/api/blogs/my` | Protected (`Bearer <token>`) | Authenticated author's published & draft blogs with calculated metrics |
| **GET** | `/api/blogs` | Public (Optional JWT) | Public blog feed. Supports `?search`, `?category`, `?status`. Isolates drafts |
| **GET** | `/api/blogs/:id` | Public (Optional JWT) | Standalone blog post by MongoDB ObjectId. Unowned drafts return 404 |
| **POST** | `/api/blogs` | Protected (`Bearer <token>`) | Create a new blog post or draft linked to authenticated author |
| **PUT** | `/api/blogs/:id` | Protected (`Bearer <token>`) | Update own blog post or publish draft (403 Forbidden for non-owners) |
| **DELETE** | `/api/blogs/:id` | Protected (`Bearer <token>`) | Delete own blog post (403 Forbidden for non-owners) |

---

## 🧪 Automated Testing Suite (110 Tests)

BlogCraft features a comprehensive automated testing suite covering all integration points.

Run all tests from the repository root:
```bash
npm test
```

Or execute within `backend/`:
```bash
cd backend
npm test
```

### Test Suite Breakdown:
1. **Module 3 Suite (`test-module3.js`)**: Health verification, database connection, user registration, bcrypt password hashing, login, blog creation, population, and data persistence.
2. **Module 4 Suite (`test-module4.js` — 47 Tests)**: Authenticated create, unauthenticated rejection (401), reading feed, reading individual blog, 404 handling, editing own blog, cross-user edit rejection (403), deleting own blog, cross-user delete rejection (403), draft privacy, publishing drafts, keyword search, category filtering, combined filtering, and persistence.
3. **Module 5 Suite (`test-module5.js` — 63 Tests)**: Valid registration, duplicate email rejection (409), successful login, invalid login rejection (401 with generic message), missing token rejection (401), invalid/tampered token rejection (401), expired token rejection (401), protected dashboard API (`GET /api/blogs/my`), Account A vs Account B blog isolation, draft isolation, cross-user update/delete protection, profile retrieval with `createdAt` and stats, profile updating with privilege escalation guards, client logout handling, and full regression checks.

---

## 💻 Local Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/bharat2327/blogcraft.git
cd blogcraft
```

### 2. Install Dependencies
```bash
npm install
cd backend && npm install && cd ..
```

### 3. Environment Variables Setup
Create `backend/.env`:
```bash
cp backend/.env.example backend/.env
```

Configuration variables:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/blog_application
JWT_SECRET=your-secure-jwt-secret-key-here
CLIENT_ORIGIN=http://localhost:8080
```
> *Note: If a standalone MongoDB instance is not detected on port 27017, the application automatically initializes an embedded local MongoDB engine, allowing immediate local execution with zero setup.*

### 4. Start the Application
Run the unified full-stack server from the root directory:
```bash
npm start
```
The application will be live at `http://localhost:5000`.

Alternatively, run the backend server and frontend dev server separately:
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
npx serve . -p 8080
```

---

## 🌐 Production Deployment Architecture

BlogCraft supports two streamlined deployment architectures:

### Option A: Unified Full-Stack on Render (Recommended)
Express serves both the REST API and the static frontend, eliminating CORS complexity.

1. Connect your GitHub repository (`bharat2327/blogcraft`) to [Render](https://render.com).
2. Create a new **Web Service**:
   - **Environment**: Node
   - **Build Command**: `npm install && cd backend && npm install`
   - **Start Command**: `node backend/server.js`
3. Configure Environment Variables in Render Dashboard:
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: `<generate-a-secure-random-secret>`
   - `MONGODB_URI`: `<your-mongodb-atlas-connection-string>`

### Option B: Vercel Deployment
The repository includes a `vercel.json` and `api/index.js` configuration:
1. Import `bharat2327/blogcraft` in [Vercel](https://vercel.com).
2. Set Environment Variables (`MONGODB_URI`, `JWT_SECRET`, `NODE_ENV=production`).
3. Deploy directly.

---

## 👤 Author

- **Developer:** Bharat
- **GitHub:** [@bharat2327](https://github.com/bharat2327)
- **Repository:** [https://github.com/bharat2327/blogcraft](https://github.com/bharat2327/blogcraft)
