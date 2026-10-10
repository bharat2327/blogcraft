require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB, isDbConnected } = require('./config/database');
const User = require('./models/User');
const Blog = require('./models/Blog');

const authRoutes = require('./routes/auth.routes');
const blogRoutes = require('./routes/blog.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration supporting local frontend dev server and direct browser origin
const allowedOrigins = [
  'http://localhost:8080',
  'http://127.0.0.1:8080',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.CLIENT_ORIGIN
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger for development
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint (Phase 8 requirement)
app.get('/api/health', (req, res) => {
  const connected = isDbConnected();
  res.status(connected ? 200 : 503).json({
    success: connected,
    message: 'Backend is running',
    database: connected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Mount modular REST APIs
app.use('/api/auth', authRoutes);
app.use('/api/blogs', blogRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API route ${req.method} ${req.originalUrl} not found.`
  });
});

// Global error handling middleware (Phase 23)
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({
      success: false,
      message: messages.join(', ')
    });
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(404).json({
      success: false,
      message: `Resource not found with ID ${err.value}`
    });
  }

  // Duplicate key error
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Duplicate key error: A record with that identifier already exists.'
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error occurred.'
  });
});

// Seed initial demo data into MongoDB if collections are empty
async function seedInitialData() {
  try {
    const userCount = await User.countDocuments();
    let demoUser = null;
    if (userCount === 0) {
      demoUser = new User({
        name: 'Demo User',
        email: 'demo@example.com',
        password: 'password123'
      });
      await demoUser.save();
      console.log('🌱 Seeded default demo user in MongoDB: demo@example.com / password123');
    } else {
      demoUser = await User.findOne({ email: 'demo@example.com' });
    }

    const blogCount = await Blog.countDocuments();
    if (blogCount === 0 && demoUser) {
      const initialBlogs = [
        {
          title: 'Mastering CSS Grid and Flexbox: The Ultimate Visual Guide',
          category: 'CSS & Styling',
          image: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80',
          description: 'Dive deep into modern 2D and 1D layout techniques to build responsive, fluid web interfaces without brittle hacks.',
          content: 'CSS Grid and Flexbox are the two most powerful layout systems in modern web development. When used together, they eliminate the need for complicated positioning tricks and external float hacks.\n\nFlexbox is designed for one-dimensional layouts — either a row or a column. It excels at distributing space among items, aligning content within a navbar, or centering elements vertically and horizontally with effortless precision.\n\nCSS Grid, on the other hand, is built for two-dimensional layouts. It gives developers full control over both columns and rows simultaneously. You can define complex magazine-style editorial layouts, card grids with automatic wrapping using minmax() and auto-fit, and responsive page skeletons without a single media query.\n\nKey Best Practice: Use CSS Grid for the macro layout of your webpage, and Flexbox for the micro layout of individual UI components inside each grid area.',
          status: 'published',
          featured: true,
          author: demoUser._id,
          authorName: demoUser.name
        },
        {
          title: 'Modern Vanilla JavaScript: ES6+ Patterns You Must Know',
          category: 'JavaScript',
          image: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?auto=format&fit=crop&w=800&q=80',
          description: 'Write clean, performant JavaScript without relying on heavy frameworks. Master destructuring, async/await, and modules.',
          content: 'JavaScript has evolved dramatically over the last decade. With modern ECMAScript standards, many tasks that once required massive libraries like jQuery or heavy frameworks can now be achieved natively in just a few lines of clean, readable code.\n\nEssential Modern JS Concepts:\n1. Destructuring & Spread Syntax: Unpack arrays and objects intuitively to keep your code DRY and declarative.\n2. Optional Chaining (?.) and Nullish Coalescing (??): Safely navigate deep object graphs without tedious undefined checks.\n3. Native Array Methods: Master map(), filter(), reduce(), and find() for declarative, immutability-friendly data transformations.\n4. Async/Await: Clean up asynchronous callback spaghetti into readable, synchronous-looking workflows.\n\nBy mastering these fundamentals, your code becomes easier to maintain, faster to execute, and virtually framework-agnostic.',
          status: 'published',
          featured: false,
          author: demoUser._id,
          authorName: demoUser.name
        },
        {
          title: 'Building Accessible Web Applications (WCAG 2.2 in Practice)',
          category: 'Accessibility',
          image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
          description: 'Ensure your digital experiences are usable by everyone. Practical strategies for keyboard navigation, ARIA, and contrast.',
          content: 'Accessibility is not a feature or an afterthought; it is a fundamental pillar of professional software engineering. Making your site accessible ensures people with visual, auditory, motor, or cognitive disabilities can access information equally.\n\nQuick Wins for High Accessibility:\n- Semantic HTML: Always use proper elements (<button>, <main>, <nav>, <article>, <header>) rather than generic <div> containers.\n- Keyboard Accessibility: Ensure every interactive element can be tabbed to and activated using the Enter or Space key.\n- Visible Focus Indicators: Never remove outlines (outline: none) without providing an equally distinct focus style.\n- Meaningful Alt Text: Describe the intent and context of images, or leave alt="" for purely decorative graphics.\n\nAn accessible web is a better, more robust web for everyone.',
          status: 'published',
          featured: false,
          author: demoUser._id,
          authorName: 'Sarah Jenkins'
        },
        {
          title: 'UI/UX Design Systems: From Wireframe to Polished Production',
          category: 'UI/UX Design',
          image: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&w=800&q=80',
          description: 'Discover how design tokens, typography scales, and consistent spacing create cohesive digital experiences.',
          content: 'A well-architected design system bridges the gap between designers and frontend engineers. It establishes a shared vocabulary and eliminates decision fatigue during rapid product development.\n\nCore Pillars of a Design System:\n- Color Palette: Define purposeful semantic roles (primary, neutral, surface, success, danger) rather than arbitrary HEX codes.\n- Typography Hierarchy: Set a clear scale with proportional line-heights for optimal readability on mobile and desktop.\n- Spacing & Rhythm: Standardize margins and paddings using 4px or 8px increments.\n- Micro-interactions: Subtle transitions on buttons and inputs provide tangible tactile feedback to the user.\n\nConsistency breeds user trust, and a strong design system guarantees that consistency at scale.',
          status: 'published',
          featured: false,
          author: demoUser._id,
          authorName: 'Alex Rivera'
        },
        {
          title: 'Optimizing Core Web Vitals for Instant Page Loads',
          category: 'Performance',
          image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
          description: 'Learn how to achieve near-perfect Lighthouse scores by reducing layout shifts and optimizing critical rendering paths.',
          content: `Website speed directly correlates with conversion rates, SEO ranking, and user satisfaction. Google's Core Web Vitals measure real-world user experience across three main metrics: LCP (Largest Contentful Paint), INP (Interaction to Next Paint), and CLS (Cumulative Layout Shift).\n\nPractical Speed Tips:\n1. Image Optimization: Use modern WebP/AVIF formats and specify width/height attributes to prevent CLS.\n2. Font Loading: Utilize font-display: swap to prevent flash of invisible text.\n3. Script Loading: Defer or asynchronously load non-critical JavaScript to prevent blocking the main rendering thread.\n4. CSS Minification & Critical Inlining: Keep initial CSS payloads lightweight and cleanly organized.\n\nSpeed isn't just a metric — it's an essential user feature.`,
          status: 'published',
          featured: false,
          author: demoUser._id,
          authorName: demoUser.name
        },
        {
          title: 'Draft: Upcoming Trends in Web Development for 2027',
          category: 'Web Development',
          image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
          description: 'An early preview into next-generation web technologies, edge computing, and AI-assisted interfaces.',
          content: 'Drafting initial insights on emerging web architectures, native WebAssembly capabilities, and offline-first client storage strategies.\n\nNotes:\n- Expanding client-side AI integration.\n- Progressive web app enhancements.\n- Container queries becoming standard practice.',
          status: 'draft',
          featured: false,
          author: demoUser._id,
          authorName: demoUser.name
        }
      ];

      await Blog.insertMany(initialBlogs);
      console.log('🌱 Seeded initial sample blogs in MongoDB');
    }
  } catch (err) {
    console.error('Data seeding warning:', err.message);
  }
}

// Start Express server ONLY after database connects successfully (Phase 7)
let serverInstance = null;

async function startServer() {
  try {
    console.log('⏳ Connecting to MongoDB database...');
    await connectDB();
    await seedInitialData();

    serverInstance = app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(`🚀 BlogCraft Express Backend Server is running!`);
      console.log(`📡 URL: http://localhost:${PORT}`);
      console.log(`🩺 Health check: http://localhost:${PORT}/api/health`);
      console.log(`💾 Database: MongoDB (Mongoose connected)`);
      console.log(`===============================================`);
    });

    return serverInstance;
  } catch (err) {
    console.error(`💥 Failed to start application: MongoDB connection failed.`);
    console.error(err);
    process.exit(1);
  }
}

async function stopServer() {
  try {
    const { disconnectDB } = require('./config/database');
    if (serverInstance) {
      await new Promise(resolve => serverInstance.close(resolve));
      serverInstance = null;
    }
    await disconnectDB();
  } catch (err) {
    console.error('Error stopping server:', err);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer, stopServer };
