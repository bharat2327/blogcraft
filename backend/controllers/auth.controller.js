const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Blog = require('../models/Blog');
const { JWT_SECRET } = require('../middleware/auth.middleware');

function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase().trim());
}

function generateToken(user) {
  return jwt.sign(
    {
      id: user._id.toString(),
      name: user.name,
      email: user.email
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

const AuthController = {
  // POST /api/auth/register
  async register(req, res) {
    try {
      const { name, email, password } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Full name is required.'
        });
      }

      if (!email || !email.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Email address is required.'
        });
      }

      if (!isValidEmail(email)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address.'
        });
      }

      if (!password) {
        return res.status(400).json({
          success: false,
          message: 'Password is required.'
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long.'
        });
      }

      // Check whether user with this email already exists in MongoDB
      const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Email already registered'
        });
      }

      // Create new MongoDB user document
      const newUser = new User({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: password
      });

      await newUser.save();
      const token = generateToken(newUser);

      return res.status(201).json({
        success: true,
        message: 'User registered successfully',
        token,
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email
        }
      });
    } catch (err) {
      console.error('Registration error:', err);
      if (err.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'Email already registered'
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Internal server error during registration.'
      });
    }
  },

  // POST /api/auth/login
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required.'
        });
      }

      // Find user in MongoDB
      const user = await User.findOne({ email: email.toLowerCase().trim() });
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.'
        });
      }

      // Compare password with bcrypt
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.'
        });
      }

      // Generate JWT
      const token = generateToken(user);

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email
        }
      });
    } catch (err) {
      console.error('Login error:', err);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during login.'
      });
    }
  },

  // GET /api/auth/me (Protected - Module 5 Profile display)
  async getMe(req, res) {
    try {
      const user = await User.findById(req.user.id).select('-password');
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User account not found.'
        });
      }

      // Compute statistics for the authenticated user
      const [totalBlogs, publishedBlogs, draftBlogs] = await Promise.all([
        Blog.countDocuments({ author: user._id }),
        Blog.countDocuments({ author: user._id, status: 'published' }),
        Blog.countDocuments({ author: user._id, status: 'draft' })
      ]);

      return res.status(200).json({
        success: true,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          stats: {
            total: totalBlogs,
            published: publishedBlogs,
            drafts: draftBlogs
          }
        }
      });
    } catch (err) {
      console.error('Server error retrieving user profile:', err);
      return res.status(500).json({
        success: false,
        message: 'Server error retrieving user profile.'
      });
    }
  },

  // PUT /api/auth/profile (Protected - Module 5 Profile update)
  async updateProfile(req, res) {
    try {
      const { name } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Full name is required.'
        });
      }

      if (name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Name must be at least 2 characters long.'
        });
      }

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User account not found.'
        });
      }

      // Restrict modification strictly to safe profile fields (never alter role, email, password, or _id)
      user.name = name.trim();
      await user.save();

      // Synchronize authorName on blogs owned by this author
      await Blog.updateMany({ author: user._id }, { authorName: user.name });

      // Retrieve current blog stats
      const [totalBlogs, publishedBlogs, draftBlogs] = await Promise.all([
        Blog.countDocuments({ author: user._id }),
        Blog.countDocuments({ author: user._id, status: 'published' }),
        Blog.countDocuments({ author: user._id, status: 'draft' })
      ]);

      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully.',
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          stats: {
            total: totalBlogs,
            published: publishedBlogs,
            drafts: draftBlogs
          }
        }
      });
    } catch (err) {
      console.error('Update profile error:', err);
      return res.status(500).json({
        success: false,
        message: 'Internal server error updating profile.'
      });
    }
  }
};

module.exports = AuthController;
