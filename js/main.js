/**
 * BlogCraft - Main JavaScript Application File
 * Common utilities, navigation state, toast system, and sample data seeding
 */

// ---------------------------------------------------------------------------
// 1. Storage Keys & Defaults
// ---------------------------------------------------------------------------
const STORAGE_KEYS = {
  USERS: 'blogcraft_users',
  CURRENT_USER: 'blogcraft_current_user',
  BLOGS: 'blogcraft_blogs',
  TOKEN: 'token'
};

const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Universal backend API fetch client with automatic JWT header attachment
 */
async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers
  };

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await res.json().catch(() => ({}));

    // Detect expired or revoked authentication token on protected endpoints
    if (res.status === 401 && !endpoint.startsWith('/auth/login') && !endpoint.startsWith('/auth/register')) {
      console.warn(`[Auth Guard] Token expired or rejected by server on ${endpoint}`);
      localStorage.removeItem('token');
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);

      const currentFile = window.location.pathname.split('/').pop();
      if (currentFile === 'dashboard.html' || currentFile === 'create-blog.html') {
        sessionStorage.setItem('redirect_after_login', currentFile);
        window.location.href = 'login.html?sessionExpired=true';
      }
    }

    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    console.warn(`API Connection Error [${endpoint}]:`, err.message);
    return {
      ok: false,
      status: 0,
      data: { success: false, message: 'Unable to connect to Express backend server (http://localhost:5000).' }
    };
  }
}


// Initial default user for seamless evaluation
const DEFAULT_USERS = [
  {
    id: 1,
    name: "Demo User",
    email: "demo@example.com",
    password: "password123"
  }
];

// 6 Rich, production-quality sample blogs with curated Unsplash imagery
const DEFAULT_BLOGS = [
  {
    id: 1,
    title: "Mastering CSS Grid and Flexbox: The Ultimate Visual Guide",
    category: "CSS & Styling",
    image: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80",
    description: "Dive deep into modern 2D and 1D layout techniques to build responsive, fluid web interfaces without brittle hacks.",
    content: `CSS Grid and Flexbox are the two most powerful layout systems in modern web development. When used together, they eliminate the need for complicated positioning tricks and external float hacks.\n\nFlexbox is designed for one-dimensional layouts — either a row or a column. It excels at distributing space among items, aligning content within a navbar, or centering elements vertically and horizontally with effortless precision.\n\nCSS Grid, on the other hand, is built for two-dimensional layouts. It gives developers full control over both columns and rows simultaneously. You can define complex magazine-style editorial layouts, card grids with automatic wrapping using minmax() and auto-fit, and responsive page skeletons without a single media query.\n\nKey Best Practice: Use CSS Grid for the macro layout of your webpage, and Flexbox for the micro layout of individual UI components inside each grid area.`,
    author: "Demo User",
    date: "Oct 02, 2026",
    status: "published",
    featured: true
  },
  {
    id: 2,
    title: "Modern Vanilla JavaScript: ES6+ Patterns You Must Know",
    category: "JavaScript",
    image: "https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?auto=format&fit=crop&w=800&q=80",
    description: "Write clean, performant JavaScript without relying on heavy frameworks. Master destructuring, async/await, and modules.",
    content: `JavaScript has evolved dramatically over the last decade. With modern ECMAScript standards, many tasks that once required massive libraries like jQuery or heavy frameworks can now be achieved natively in just a few lines of clean, readable code.\n\nEssential Modern JS Concepts:\n1. Destructuring & Spread Syntax: Unpack arrays and objects intuitively to keep your code DRY and declarative.\n2. Optional Chaining (?.) and Nullish Coalescing (??): Safely navigate deep object graphs without tedious undefined checks.\n3. Native Array Methods: Master map(), filter(), reduce(), and find() for declarative, immutability-friendly data transformations.\n4. Async/Await: Clean up asynchronous callback spaghetti into readable, synchronous-looking workflows.\n\nBy mastering these fundamentals, your code becomes easier to maintain, faster to execute, and virtually framework-agnostic.`,
    author: "Demo User",
    date: "Sep 28, 2026",
    status: "published",
    featured: false
  },
  {
    id: 3,
    title: "Building Accessible Web Applications (WCAG 2.2 in Practice)",
    category: "Accessibility",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80",
    description: "Ensure your digital experiences are usable by everyone. Practical strategies for keyboard navigation, ARIA, and contrast.",
    content: `Accessibility is not a feature or an afterthought; it is a fundamental pillar of professional software engineering. Making your site accessible ensures people with visual, auditory, motor, or cognitive disabilities can access information equally.\n\nQuick Wins for High Accessibility:\n- Semantic HTML: Always use proper elements (<button>, <main>, <nav>, <article>, <header>) rather than generic <div> containers.\n- Keyboard Accessibility: Ensure every interactive element can be tabbed to and activated using the Enter or Space key.\n- Visible Focus Indicators: Never remove outlines (outline: none) without providing an equally distinct focus style.\n- Meaningful Alt Text: Describe the intent and context of images, or leave alt="" for purely decorative graphics.\n\nAn accessible web is a better, more robust web for everyone.`,
    author: "Sarah Jenkins",
    date: "Sep 22, 2026",
    status: "published",
    featured: false
  },
  {
    id: 4,
    title: "UI/UX Design Systems: From Wireframe to Polished Production",
    category: "UI/UX Design",
    image: "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&w=800&q=80",
    description: "Discover how design tokens, typography scales, and consistent spacing create cohesive digital experiences.",
    content: `A well-architected design system bridges the gap between designers and frontend engineers. It establishes a shared vocabulary and eliminates decision fatigue during rapid product development.\n\nCore Pillars of a Design System:\n- Color Palette: Define purposeful semantic roles (primary, neutral, surface, success, danger) rather than arbitrary HEX codes.\n- Typography Hierarchy: Set a clear scale with proportional line-heights for optimal readability on mobile and desktop.\n- Spacing & Rhythm: Standardize margins and paddings using 4px or 8px increments.\n- Micro-interactions: Subtle transitions on buttons and inputs provide tangible tactile feedback to the user.\n\nConsistency breeds user trust, and a strong design system guarantees that consistency at scale.`,
    author: "Alex Rivera",
    date: "Sep 15, 2026",
    status: "published",
    featured: false
  },
  {
    id: 5,
    title: "Optimizing Core Web Vitals for Instant Page Loads",
    category: "Performance",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
    description: "Learn how to achieve near-perfect Lighthouse scores by reducing layout shifts and optimizing critical rendering paths.",
    content: `Website speed directly correlates with conversion rates, SEO ranking, and user satisfaction. Google's Core Web Vitals measure real-world user experience across three main metrics: LCP (Largest Contentful Paint), INP (Interaction to Next Paint), and CLS (Cumulative Layout Shift).\n\nPractical Speed Tips:\n1. Image Optimization: Use modern WebP/AVIF formats and specify width/height attributes to prevent CLS.\n2. Font Loading: Utilize font-display: swap to prevent flash of invisible text.\n3. Script Loading: Defer or asynchronously load non-critical JavaScript to prevent blocking the main rendering thread.\n4. CSS Minification & Critical Inlining: Keep initial CSS payloads lightweight and cleanly organized.\n\nSpeed isn't just a metric — it's an essential user feature.`,
    author: "Demo User",
    date: "Sep 10, 2026",
    status: "published",
    featured: false
  },
  {
    id: 6,
    title: "Draft: Upcoming Trends in Web Development for 2027",
    category: "Web Development",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
    description: "An early preview into next-generation web technologies, edge computing, and AI-assisted interfaces.",
    content: `Drafting initial insights on emerging web architectures, native WebAssembly capabilities, and offline-first client storage strategies.\n\nNotes:\n- Expanding client-side AI integration.\n- Progressive web app enhancements.\n- Container queries becoming standard practice.`,
    author: "Demo User",
    date: "Oct 05, 2026",
    status: "draft",
    featured: false
  }
];

// ---------------------------------------------------------------------------
// 2. LocalStorage Helpers & Data Initialization
// ---------------------------------------------------------------------------
function initLocalStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
  }

  if (!localStorage.getItem(STORAGE_KEYS.BLOGS)) {
    localStorage.setItem(STORAGE_KEYS.BLOGS, JSON.stringify(DEFAULT_BLOGS));
  }
}

// ---------------------------------------------------------------------------
// 3. Toast Notification Component
// ---------------------------------------------------------------------------
function showToast(message, type = 'info', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || '•'}</span>
    <span class="toast-message">${escapeHtml(message)}</span>
    <button class="toast-close" aria-label="Close notification">&times;</button>
  `;

  const closeBtn = toast.querySelector('.toast-close');
  const removeToast = () => {
    toast.classList.add('toast-hide');
    setTimeout(() => {
      if (toast.parentElement) toast.parentElement.removeChild(toast);
    }, 250);
  };

  closeBtn.addEventListener('click', removeToast);
  container.appendChild(toast);

  if (duration > 0) {
    setTimeout(removeToast, duration);
  }
}

// ---------------------------------------------------------------------------
// 4. Utility Functions
// ---------------------------------------------------------------------------
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(dateObj = new Date()) {
  const options = { month: 'short', day: '2-digit', year: 'numeric' };
  return dateObj.toLocaleDateString('en-US', options);
}

// ---------------------------------------------------------------------------
// 5. Navigation Bar Updates (Authentication-aware)
// ---------------------------------------------------------------------------
function updateNavbar() {
  const currentUserRaw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  const currentUser = currentUserRaw ? JSON.parse(currentUserRaw) : null;
  const navActions = document.getElementById('nav-actions');

  if (!navActions) return;

  if (currentUser) {
    // Logged-in state
    const firstLetter = currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U';
    navActions.innerHTML = `
      <div class="user-menu-chip" title="${escapeHtml(currentUser.email)}">
        <span class="user-avatar-tiny">${firstLetter}</span>
        <span>Hi, ${escapeHtml(currentUser.name.split(' ')[0])}</span>
      </div>
      <a href="dashboard.html" class="btn btn-secondary btn-sm" id="nav-dashboard-btn">Dashboard</a>
      <button class="btn btn-outline btn-sm" id="nav-logout-btn">Logout</button>
    `;

    const logoutBtn = document.getElementById('nav-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        if (typeof logoutUser === 'function') {
          logoutUser();
        } else {
          localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
          showToast('You have been logged out.', 'info');
          setTimeout(() => {
            window.location.href = 'index.html';
          }, 600);
        }
      });
    }
  } else {
    // Logged-out state
    navActions.innerHTML = `
      <a href="login.html" class="btn btn-secondary btn-sm" id="nav-login-btn">Login</a>
      <a href="register.html" class="btn btn-primary btn-sm" id="nav-register-btn">Register</a>
    `;
  }
}

// Mobile Hamburger Menu Setup
function setupMobileMenu() {
  const toggleBtn = document.getElementById('mobile-menu-toggle');
  const navLinks = document.getElementById('nav-links');

  if (toggleBtn && navLinks) {
    toggleBtn.addEventListener('click', () => {
      navLinks.classList.toggle('mobile-open');
      const isOpen = navLinks.classList.contains('mobile-open');
      toggleBtn.setAttribute('aria-expanded', isOpen);
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (!toggleBtn.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.classList.remove('mobile-open');
      }
    });
  }
}

// Set active navigation link based on current page
function setActiveNavLink() {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const links = document.querySelectorAll('.nav-link');
  links.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

// ---------------------------------------------------------------------------
// 6. Global Lifecycle Execution
// ---------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  initLocalStorage();
  updateNavbar();
  setupMobileMenu();
  setActiveNavLink();

  // Scroll navbar styling
  window.addEventListener('scroll', () => {
    const nav = document.querySelector('.navbar');
    if (nav) {
      if (window.scrollY > 15) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    }
  });
});
