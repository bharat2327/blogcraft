const express = require('express');
const router = express.Router();
const BlogController = require('../controllers/blog.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Public routes
router.get('/', BlogController.getAllBlogs);
router.get('/:id', BlogController.getBlogById);

// Protected routes (Requires JWT)
router.post('/', verifyToken, BlogController.createBlog);
router.put('/:id', verifyToken, BlogController.updateBlog);
router.delete('/:id', verifyToken, BlogController.deleteBlog);

module.exports = router;
