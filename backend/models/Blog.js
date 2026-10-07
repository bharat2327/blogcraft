const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Blog title is required'],
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true
    },
    image: {
      type: String,
      default: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=800&q=80',
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Blog description is required'],
      trim: true
    },
    content: {
      type: String,
      required: [true, 'Blog content is required'],
      trim: true
    },
    status: {
      type: String,
      enum: ['published', 'draft'],
      default: 'published'
    },
    featured: {
      type: Boolean,
      default: false
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author reference is required']
    },
    // Optional cached author name for fast display / offline support
    authorName: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id;
        // Format custom date string for UI
        if (ret.createdAt) {
          ret.date = new Date(ret.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric'
          });
        }
        delete ret.__v;
        return ret;
      }
    },
    toObject: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Query performance and text search indexes
blogSchema.index({ status: 1, createdAt: -1 });
blogSchema.index({ category: 1, status: 1 });
blogSchema.index({ author: 1 });
blogSchema.index({ title: 'text', description: 'text' });

const Blog = mongoose.model('Blog', blogSchema);

module.exports = Blog;
