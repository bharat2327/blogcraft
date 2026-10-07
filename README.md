# Module 1 — Frontend Blog Application

A modern, responsive, and production-quality frontend blog web application built entirely with semantic **HTML5**, modern **CSS3**, and modular **Vanilla JavaScript**. Designed with zero framework dependencies and full client-side persistence using `localStorage`.

---

## Overview

**BlogCraft** is an interactive, responsive blogging platform developed as part of **Module 1 — Frontend Development**. It simulates a full-stack content publishing platform entirely in the browser, featuring user authentication, session-protected dashboards, dynamic article creation, live image previews, instant search filtering, and custom non-blocking toast notifications.

---

## Features

- **Responsive Blog UI**: Fluid grid and flexbox design optimized for mobile, tablet, laptop, and desktop viewports with a collapsible hamburger navigation menu.
- **Modern Typography & Styling**: Custom design system using Google Font *Plus Jakarta Sans*, sleek dark/light color tokens, smooth card hover micro-interactions, and accessible contrast ratios.
- **Authentication System**:
  - Author Registration with full client-side validation (full name, email regex, minimum 6-character password, and password confirmation matching).
  - Secure Login with one-click **"Auto-Fill"** demo credentials and password visibility toggle.
  - Route protection guarding the author dashboard and article editor.
  - Session persistence in `localStorage` with dynamic navbar greeting and logout action.
- **Interactive Author Dashboard**:
  - Real-time statistics tracking **Total Articles**, **Published Articles**, and **Saved Drafts**.
  - Author profile section with initials avatar and contact display.
  - Dynamic blog management table with thumbnail previews, category pills, status badges (*Published* in green, *Draft* in amber), publication dates, and quick action buttons.
  - Real-time search filter for articles within the dashboard.
- **Article Publishing & Management (CRUD)**:
  - **Create**: Add posts with title, category selector, featured image URL, live image preview box, 4 quick preset image pickers, description, and multi-paragraph article content.
  - **Draft vs. Publish**: Dual submission buttons to either publish live immediately or save privately as a draft.
  - **Read**: Full-screen interactive reader modal to read articles with complete formatting without leaving the page.
  - **Update**: Edit existing articles via `create-blog.html?edit=[id]` with automatic form pre-population.
  - **Delete**: Custom modal confirmation dialog to safely remove posts from `localStorage`.
- **Homepage Discovery**:
  - Spotlight Featured Story hero banner.
  - Real-time search input matching titles, summaries, categories, and author names.
  - Interactive category filter pills (*All Topics*, *CSS & Styling*, *JavaScript*, *UI/UX Design*, *Accessibility*, *Performance*, *Web Development*).
- **Polished UI/UX & Notifications**:
  - Non-blocking custom Toast notification component (`success`, `error`, `warning`, `info`).
  - Strict absence of disruptive browser `alert()` popups.

---

## Technologies

- **HTML5**: Semantic elements (`<header>`, `<nav>`, `<main>`, `<article>`, `<aside>`, `<section>`, `<footer>`).
- **CSS3**: Custom Properties (CSS variables), Flexbox, CSS Grid, Media Queries, glassmorphic backdrop filters, and custom CSS animations.
- **Vanilla JavaScript (ES6+)**: `localStorage` data management, DOM manipulation, custom event listeners, array methods (`map`, `filter`, `find`), URLSearchParams routing, and regex form validation.
- **No External Frameworks**: 100% framework-free (no React, Angular, Vue, or TailwindCSS).

---

## Project Structure

```text
blog-application/
│
├── index.html            # Public home page with search, filters, featured & recent blogs
├── login.html            # Sign-in page with validation and demo auto-fill
├── register.html         # Registration page with password confirmation
├── dashboard.html        # Protected author dashboard with stats & blog table
├── create-blog.html      # Article creator & editor with live image preview
├── README.md             # Project documentation
├── .gitignore            # Secret & artifact exclusion rules
│
├── css/
│   └── style.css         # Complete modern design system and responsive layout
│
├── js/
│   ├── main.js           # Core utilities, sample data seeding, toasts, dynamic navbar
│   ├── auth.js           # User registration, login, logout, and route guards
│   ├── blog.js           # Blog CRUD store, home grid, instant search, reading modal
│   └── dashboard.js      # Dashboard analytics, table rendering, delete modal, form handlers
│
└── assets/
    └── images/
        └── logo.svg      # Vector brand icon
```

---

## How to Run

Because BlogCraft uses native web standards and client-side `localStorage`, it requires **no build step, no npm install, and no backend server** to operate!

### Method 1: Using Any Local Web Server (Recommended)

1. Open your terminal in this project directory:
   ```bash
   # Using Python 3:
   python -m http.server 8080

   # Or using Node.js npx:
   npx serve .
   ```
2. Open your browser and navigate to:
   ```text
   http://localhost:8080/index.html
   ```

### Method 2: Open Directly in Any Browser

Double-click `index.html` or right-click and choose **"Open with Google Chrome"** (or Edge, Firefox, Safari).

---

## Testing

A pre-configured demo author account is automatically seeded in `localStorage`:

- **Email:** `demo@example.com`
- **Password:** `password123`

### Verification Checklist:
- [x] **Home Page:** Search articles, filter by category pills, open reader modal.
- [x] **Authentication:** Register a new user, test validation, log in, view greeting in navbar.
- [x] **Dashboard Protection:** Accessing `dashboard.html` without login automatically redirects to `login.html`.
- [x] **Blog Creation:** Create both Published posts and Drafts with live image preview.
- [x] **Blog Editing:** Edit an existing post and verify updated content in dashboard and homepage.
- [x] **Blog Deletion:** Delete a post using modal confirmation and verify stats decrement.
- [x] **Responsiveness:** Test on mobile screens (<= 768px) with hamburger menu.

---

## Future Improvements

- Markdown editor support for rich-text code snippets and syntax highlighting.
- Reading time estimation (e.g., "5 min read") calculated automatically from word counts.
- Dark mode toggle with persistent user preference in `localStorage`.
- Client-side export and import of blog posts as JSON backups.

---

## Author

- **Developer:** Bharat
- **Repository:** https://github.com/bharat2327/blogcraft.git
