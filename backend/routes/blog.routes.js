const express = require('express');
const router = express.Router();
const BlogController = require('../controllers/blog.controller');
const { verifyToken, optionalAuth } = require('../middleware/auth.middleware');

// Protected author dashboard route (placed BEFORE /:id to prevent parameter route shadowing)
router.get('/my', verifyToken, BlogController.getMyBlogs);

// Public routes (with optional auth to allow authors to access their own drafts)
router.get('/', optionalAuth, BlogController.getAllBlogs);
router.get('/:id', optionalAuth, BlogController.getBlogById);

// Protected routes (Requires JWT)
router.post('/', verifyToken, BlogController.createBlog);
router.put('/:id', verifyToken, BlogController.updateBlog);
router.delete('/:id', verifyToken, BlogController.deleteBlog);

module.exports = router;
