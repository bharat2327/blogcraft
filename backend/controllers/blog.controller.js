const mongoose = require('mongoose');
const Blog = require('../models/Blog');

const BlogController = {
  // GET /api/blogs
  async getAllBlogs(req, res) {
    try {
      const { category, search, status, authorId } = req.query;
      const andConditions = [];

      // Status & Draft Privacy Rules:
      if (status === 'draft') {
        if (req.user && req.user.id) {
          andConditions.push({ status: 'draft', author: req.user.id });
        } else {
          // Unauthenticated requests cannot read drafts
          return res.status(200).json({
            success: true,
            count: 0,
            blogs: []
          });
        }
      } else if (status === 'published') {
        andConditions.push({ status: 'published' });
      } else {
        // Status not explicitly provided:
        if (req.user && req.user.id) {
          if (authorId && authorId === req.user.id) {
            // Author querying their own posts (e.g., dashboard)
            andConditions.push({ author: req.user.id });
          } else {
            // Authenticated user browsing feed: public published blogs + own drafts
            andConditions.push({
              $or: [
                { status: 'published' },
                { author: req.user.id }
              ]
            });
          }
        } else {
          // Unauthenticated public request: only published blogs
          andConditions.push({ status: 'published' });
        }
      }

      // Filter by category
      if (category && category !== 'All') {
        andConditions.push({ category: { $regex: new RegExp(`^${category}$`, 'i') } });
      }

      // Filter by authorId if requested and not already added
      if (authorId && mongoose.Types.ObjectId.isValid(authorId)) {
        if (!andConditions.some(c => c.author && c.author.toString() === authorId.toString())) {
          andConditions.push({ author: authorId });
        }
      }

      // Search by title, description, category, or authorName
      if (search && search.trim()) {
        const searchRegex = new RegExp(search.trim(), 'i');
        andConditions.push({
          $or: [
            { title: searchRegex },
            { description: searchRegex },
            { category: searchRegex },
            { authorName: searchRegex }
          ]
        });
      }

      const query = andConditions.length > 0 ? { $and: andConditions } : {};

      const blogs = await Blog.find(query)
        .populate('author', 'name email')
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        count: blogs.length,
        blogs
      });
    } catch (err) {
      console.error('Error fetching blogs from MongoDB:', err);
      return res.status(500).json({
        success: false,
        message: 'Internal server error retrieving blogs.'
      });
    }
  },

  // GET /api/blogs/:id
  async getBlogById(req, res) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({
          success: false,
          message: `Blog post with ID ${id} not found.`
        });
      }

      const blog = await Blog.findById(id).populate('author', 'name email');

      if (!blog) {
        return res.status(404).json({
          success: false,
          message: `Blog post with ID ${id} not found.`
        });
      }

      // If blog is draft, only allow its author to view it
      if (blog.status === 'draft') {
        const authorId = blog.author ? (blog.author._id || blog.author).toString() : '';
        const requesterId = req.user ? req.user.id.toString() : '';
        if (!req.user || authorId !== requesterId) {
          return res.status(404).json({
            success: false,
            message: 'Blog post not found or not published.'
          });
        }
      }

      return res.status(200).json({
        success: true,
        blog
      });
    } catch (err) {
      console.error('Error retrieving blog:', err);
      return res.status(500).json({
        success: false,
        message: 'Internal server error retrieving blog.'
      });
    }
  },

  // POST /api/blogs (Protected)
  async createBlog(req, res) {
    try {
      const { title, category, image, description, content, status } = req.body;

      if (!title || !title.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Blog title is required.'
        });
      }

      if (!category || !category.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Blog category is required.'
        });
      }

      if (!description || !description.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Short description is required.'
        });
      }

      if (!content || !content.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Blog content is required.'
        });
      }

      const newBlog = new Blog({
        title: title.trim(),
        category: category.trim(),
        image: image ? image.trim() : 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=800&q=80',
        description: description.trim(),
        content: content.trim(),
        status: status === 'draft' ? 'draft' : 'published',
        author: req.user.id,
        authorName: req.user.name
      });

      await newBlog.save();
      await newBlog.populate('author', 'name email');

      return res.status(201).json({
        success: true,
        message: 'Blog post created successfully.',
        blog: newBlog
      });
    } catch (err) {
      console.error('Error creating blog:', err);
      return res.status(500).json({
        success: false,
        message: 'Internal server error creating blog.'
      });
    }
  },

  // PUT /api/blogs/:id (Protected)
  async updateBlog(req, res) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({
          success: false,
          message: `Blog with ID ${id} does not exist.`
        });
      }

      const existingBlog = await Blog.findById(id);

      if (!existingBlog) {
        return res.status(404).json({
          success: false,
          message: `Blog with ID ${id} does not exist.`
        });
      }

      // Check ownership
      const authorIdString = existingBlog.author ? existingBlog.author.toString() : '';
      const userIdString = req.user.id ? req.user.id.toString() : '';

      if (authorIdString !== userIdString) {
        return res.status(403).json({
          success: false,
          message: 'Permission denied. You can only edit your own blog posts.'
        });
      }

      const { title, category, image, description, content, status } = req.body;

      if (title !== undefined) existingBlog.title = title.trim();
      if (category !== undefined) existingBlog.category = category.trim();
      if (image !== undefined) existingBlog.image = image.trim();
      if (description !== undefined) existingBlog.description = description.trim();
      if (content !== undefined) existingBlog.content = content.trim();
      if (status !== undefined) existingBlog.status = status;

      await existingBlog.save();
      await existingBlog.populate('author', 'name email');

      return res.status(200).json({
        success: true,
        message: 'Blog updated successfully.',
        blog: existingBlog
      });
    } catch (err) {
      console.error('Error updating blog:', err);
      return res.status(500).json({
        success: false,
        message: 'Internal server error updating blog.'
      });
    }
  },

  // DELETE /api/blogs/:id (Protected)
  async deleteBlog(req, res) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({
          success: false,
          message: `Blog post with ID ${id} not found.`
        });
      }

      const existingBlog = await Blog.findById(id);

      if (!existingBlog) {
        return res.status(404).json({
          success: false,
          message: `Blog post with ID ${id} not found.`
        });
      }

      // Check ownership
      const authorIdString = existingBlog.author ? existingBlog.author.toString() : '';
      const userIdString = req.user.id ? req.user.id.toString() : '';

      if (authorIdString !== userIdString) {
        return res.status(403).json({
          success: false,
          message: 'Permission denied. You can only delete your own blog posts.'
        });
      }

      await Blog.findByIdAndDelete(id);

      return res.status(200).json({
        success: true,
        message: 'Blog post deleted successfully.'
      });
    } catch (err) {
      console.error('Error deleting blog:', err);
      return res.status(500).json({
        success: false,
        message: 'Internal server error deleting blog.'
      });
    }
  }
};

module.exports = BlogController;
