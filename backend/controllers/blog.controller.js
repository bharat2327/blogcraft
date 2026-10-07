const BlogModel = require('../models/blog.model');

const BlogController = {
  // GET /api/blogs
  async getAllBlogs(req, res) {
    try {
      const { category, search, status, authorId } = req.query;
      const blogs = await BlogModel.getAll({ category, search, status, authorId });
      return res.status(200).json({
        success: true,
        count: blogs.length,
        blogs
      });
    } catch (err) {
      console.error('Error fetching blogs:', err);
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
      const blog = await BlogModel.findById(id);

      if (!blog) {
        return res.status(404).json({
          success: false,
          message: `Blog post with ID ${id} not found.`
        });
      }

      return res.status(200).json({
        success: true,
        blog
      });
    } catch (err) {
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

      const newBlog = await BlogModel.create({
        title,
        category,
        image,
        description,
        content,
        status: status === 'draft' ? 'draft' : 'published',
        author: req.user.name,
        authorId: req.user.id
      });

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
      const existing = await BlogModel.findById(id);

      if (!existing) {
        return res.status(404).json({
          success: false,
          message: `Blog with ID ${id} does not exist.`
        });
      }

      // Check ownership (allow original author or demo admin)
      if (existing.authorId && Number(existing.authorId) !== Number(req.user.id)) {
        return res.status(403).json({
          success: false,
          message: 'Permission denied. You can only edit your own blog posts.'
        });
      }

      const { title, category, image, description, content, status } = req.body;
      const updatedFields = {};

      if (title !== undefined) updatedFields.title = title.trim();
      if (category !== undefined) updatedFields.category = category.trim();
      if (image !== undefined) updatedFields.image = image.trim();
      if (description !== undefined) updatedFields.description = description.trim();
      if (content !== undefined) updatedFields.content = content.trim();
      if (status !== undefined) updatedFields.status = status;

      const updated = await BlogModel.update(id, updatedFields);

      return res.status(200).json({
        success: true,
        message: 'Blog updated successfully.',
        blog: updated
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
      const existing = await BlogModel.findById(id);

      if (!existing) {
        return res.status(404).json({
          success: false,
          message: `Blog post with ID ${id} not found.`
        });
      }

      // Check ownership
      if (existing.authorId && Number(existing.authorId) !== Number(req.user.id)) {
        return res.status(403).json({
          success: false,
          message: 'Permission denied. You can only delete your own blog posts.'
        });
      }

      const deleted = await BlogModel.delete(id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Could not delete blog.'
        });
      }

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
