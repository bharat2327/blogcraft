/**
 * BlogCraft - Dashboard & Blog Editor Module (dashboard.js)
 * Manages Dashboard Statistics, Blog Table, Deletion Modals, and Create/Edit Form
 */

// ---------------------------------------------------------------------------
// 1. Dashboard View Management
// ---------------------------------------------------------------------------

let blogToDeleteId = null;

async function initDashboardPage() {
  if (!requireAuth()) return;

  const currentUser = getCurrentUser();
  populateUserProfile(currentUser);
  setupDashboardSearch();
  setupDeleteModal();
  await refreshDashboardData();
}

async function refreshDashboardData(filterQuery = '') {
  await getBlogsAsync();
  renderDashboardStats();
  renderDashboardTable(filterQuery);
}

function populateUserProfile(user) {
  if (!user) return;

  const firstLetter = user.name ? user.name.charAt(0).toUpperCase() : 'U';

  const avatarElems = document.querySelectorAll('.user-avatar-text');
  avatarElems.forEach(el => el.textContent = firstLetter);

  const nameElems = document.querySelectorAll('.user-display-name');
  nameElems.forEach(el => el.textContent = user.name);

  const emailElems = document.querySelectorAll('.user-display-email');
  emailElems.forEach(el => el.textContent = user.email);

  const welcomeHeader = document.getElementById('dashboard-welcome-heading');
  if (welcomeHeader) {
    welcomeHeader.textContent = `Welcome back, ${user.name.split(' ')[0]} 👋`;
  }
}

function getUserBlogs() {
  const blogs = getBlogs();
  const currentUser = getCurrentUser();
  if (!currentUser) return blogs;

  return blogs.filter(b => {
    if (!b.author) return false;
    if (typeof b.author === 'object') {
      return (b.author._id && String(b.author._id) === String(currentUser.id)) ||
             (b.author.id && String(b.author.id) === String(currentUser.id)) ||
             (b.author.email && currentUser.email && b.author.email.toLowerCase() === currentUser.email.toLowerCase());
    }
    return String(b.author) === String(currentUser.id) || b.author === currentUser.name;
  });
}

function renderDashboardStats() {
  const blogs = getUserBlogs();
  const total = blogs.length;
  const published = blogs.filter(b => b.status === 'published').length;
  const drafts = blogs.filter(b => b.status === 'draft').length;

  const totalEl = document.getElementById('stat-total-blogs');
  const publishedEl = document.getElementById('stat-published-blogs');
  const draftsEl = document.getElementById('stat-drafts-blogs');

  if (totalEl) totalEl.textContent = total;
  if (publishedEl) publishedEl.textContent = published;
  if (draftsEl) draftsEl.textContent = drafts;
}

function renderDashboardTable(filterQuery = '') {
  const tableBody = document.getElementById('dashboard-table-body');
  if (!tableBody) return;

  const blogs = getUserBlogs();
  const query = filterQuery.toLowerCase().trim();

  const filteredBlogs = blogs.filter(b => {
    if (!query) return true;
    return (b.title && b.title.toLowerCase().includes(query)) ||
           (b.category && b.category.toLowerCase().includes(query)) ||
           (b.status && b.status.toLowerCase().includes(query));
  });

  if (filteredBlogs.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center; padding: 3rem 1rem;">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">📝</div>
          <p style="font-weight: 600; color: var(--text-primary);">No blogs found</p>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">
            ${query ? 'No results matched your search keyword.' : 'You haven\'t created any blog posts yet.'}
          </p>
          <a href="create-blog.html" class="btn btn-primary btn-sm">+ Create Your First Blog</a>
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = filteredBlogs.map(blog => {
    const blogId = blog._id || blog.id;
    const isPublished = blog.status === 'published';
    const statusBadge = isPublished
      ? `<span class="badge badge-success" title="Published online">● Published</span>`
      : `<span class="badge badge-warning" title="Saved as draft">○ Draft</span>`;

    const authorName = (typeof blog.author === 'object' && blog.author !== null)
      ? (blog.author.name || 'You')
      : (blog.author || 'You');

    const formattedDate = typeof formatDate === 'function'
      ? formatDate(blog.createdAt || blog.date)
      : (blog.date || new Date(blog.createdAt).toLocaleDateString());

    return `
      <tr id="table-row-${blogId}">
        <td>
          <div class="table-blog-cell">
            <img class="table-blog-thumb" src="${escapeHtml(blog.image || '')}" alt="${escapeHtml(blog.title || '')}" onerror="this.src='https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=150&q=80'">
            <div>
              <div class="table-blog-title" title="${escapeHtml(blog.title || '')}">${escapeHtml(blog.title || '')}</div>
              <small style="color: var(--text-muted);">${escapeHtml(authorName)}</small>
            </div>
          </div>
        </td>
        <td>
          <span class="badge badge-primary">${escapeHtml(blog.category || 'General')}</span>
        </td>
        <td>
          ${statusBadge}
        </td>
        <td style="color: var(--text-secondary); font-size: 0.875rem;">
          ${escapeHtml(formattedDate)}
        </td>
        <td>
          <div class="table-actions">
            <a href="blog.html?id=${blogId}" class="btn btn-secondary btn-sm" title="View blog" target="_blank">
              👁 View
            </a>
            <a href="create-blog.html?edit=${blogId}" class="btn btn-secondary btn-sm" title="Edit this blog">
              ✎ Edit
            </a>
            <button class="btn btn-danger btn-sm" onclick="promptDeleteBlog('${blogId}')" title="Delete this blog">
              🗑 Delete
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function setupDashboardSearch() {
  const searchInput = document.getElementById('dashboard-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      renderDashboardTable(e.target.value);
    });
  }
}

// ---------------------------------------------------------------------------
// 2. Delete Confirmation Modal
// ---------------------------------------------------------------------------

function setupDeleteModal() {
  let modal = document.getElementById('delete-confirm-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'delete-confirm-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-dialog-title">
        <div class="modal-header">
          <h3 class="modal-title" id="delete-dialog-title" style="color: var(--danger);">Confirm Deletion</h3>
          <button class="modal-close-btn" id="delete-modal-close" aria-label="Cancel">&times;</button>
        </div>
        <div class="modal-body">
          <p style="color: var(--text-secondary); margin-bottom: 0.5rem;">
            Are you sure you want to delete this blog post?
          </p>
          <p id="delete-blog-name" style="font-weight: 700; color: var(--text-primary);"></p>
          <p style="font-size: 0.85rem; color: var(--danger); margin-top: 0.5rem;">
            This action cannot be undone and will permanently remove the post.
          </p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary btn-sm" id="delete-cancel-btn">Cancel</button>
          <button class="btn btn-danger btn-sm" id="delete-confirm-btn">Yes, Delete Post</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const closeDialog = () => {
      modal.classList.remove('active');
      blogToDeleteId = null;
    };

    document.getElementById('delete-modal-close').addEventListener('click', closeDialog);
    document.getElementById('delete-cancel-btn').addEventListener('click', closeDialog);

    document.getElementById('delete-confirm-btn').addEventListener('click', async () => {
      if (blogToDeleteId) {
        const success = await deleteBlog(blogToDeleteId);
        if (success) {
          showToast('Blog post deleted successfully.', 'success');
        } else {
          showToast('Could not delete blog post.', 'error');
        }
        await refreshDashboardData();
        closeDialog();
      }
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeDialog();
    });
  }
}

async function promptDeleteBlog(blogId) {
  const blog = await getBlogByIdAsync(blogId) || getBlogById(blogId);
  if (!blog) return;

  blogToDeleteId = blogId;
  setupDeleteModal();
  const modal = document.getElementById('delete-confirm-modal');
  const nameEl = document.getElementById('delete-blog-name');
  if (nameEl) nameEl.textContent = `"${blog.title}"`;

  modal.classList.add('active');
}

// ---------------------------------------------------------------------------
// 3. Create & Edit Blog Form Logic (create-blog.html)
// ---------------------------------------------------------------------------

async function initCreateBlogPage() {
  if (!requireAuth()) return;

  const form = document.getElementById('blog-form');
  if (!form) return;

  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get('edit');
  const isEditing = Boolean(editId);

  const pageTitle = document.getElementById('form-page-title');
  const submitPublishBtn = document.getElementById('btn-publish');
  const imageInput = document.getElementById('blog-image');
  const imagePreview = document.getElementById('image-preview-element');
  const placeholderText = document.getElementById('image-preview-placeholder');

  // Image Preview handler
  const updateImagePreview = (url) => {
    if (url && url.startsWith('http')) {
      imagePreview.src = url;
      imagePreview.style.display = 'block';
      if (placeholderText) placeholderText.style.display = 'none';
    } else {
      imagePreview.style.display = 'none';
      if (placeholderText) placeholderText.style.display = 'flex';
    }
  };

  if (imageInput) {
    imageInput.addEventListener('input', (e) => {
      updateImagePreview(e.target.value.trim());
    });
  }

  // Quick preset image selector buttons
  const presetButtons = document.querySelectorAll('.image-preset-btn');
  presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const url = btn.getAttribute('data-url');
      if (imageInput && url) {
        imageInput.value = url;
        updateImagePreview(url);
        showToast('Preset image applied!', 'info', 1500);
      }
    });
  });

  // Pre-fill if Editing an existing blog
  if (isEditing) {
    const existingBlog = await getBlogByIdAsync(editId) || getBlogById(editId);
    if (!existingBlog) {
      showToast('Blog post to edit not found.', 'error');
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 1000);
      return;
    }

    if (pageTitle) pageTitle.textContent = 'Edit Blog Post';
    if (submitPublishBtn) submitPublishBtn.textContent = 'Update & Publish';

    document.getElementById('blog-title').value = existingBlog.title;
    document.getElementById('blog-category').value = existingBlog.category;
    document.getElementById('blog-image').value = existingBlog.image;
    document.getElementById('blog-description').value = existingBlog.description;
    document.getElementById('blog-content').value = existingBlog.content;

    updateImagePreview(existingBlog.image);
  }

  // Handle Form Submission
  const savePost = async (targetStatus) => {
    clearAllErrors();

    const title = document.getElementById('blog-title').value.trim();
    const category = document.getElementById('blog-category').value.trim();
    const image = document.getElementById('blog-image').value.trim();
    const description = document.getElementById('blog-description').value.trim();
    const content = document.getElementById('blog-content').value.trim();

    let hasError = false;

    if (!title) {
      setFieldError('blog-title', 'Blog title is required.');
      hasError = true;
    } else if (title.length < 5) {
      setFieldError('blog-title', 'Title must be at least 5 characters long.');
      hasError = true;
    }

    if (!category) {
      setFieldError('blog-category', 'Please select or enter a category.');
      hasError = true;
    }

    if (!description) {
      setFieldError('blog-description', 'Short description is required.');
      hasError = true;
    } else if (description.length < 15) {
      setFieldError('blog-description', 'Description should be at least 15 characters.');
      hasError = true;
    }

    if (!content) {
      setFieldError('blog-content', 'Blog article content is required.');
      hasError = true;
    } else if (content.length < 30) {
      setFieldError('blog-content', 'Content is too short (minimum 30 characters).');
      hasError = true;
    }

    if (hasError) {
      showToast('Please fix the errors in the blog form.', 'error');
      return;
    }

    if (submitPublishBtn) submitPublishBtn.disabled = true;

    const blogPayload = {
      title,
      category,
      image: image || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=800&q=80',
      description,
      content,
      status: targetStatus
    };

    try {
      if (isEditing) {
        await updateBlog(editId, blogPayload);
        showToast(targetStatus === 'published' ? 'Blog updated and published!' : 'Draft changes saved!', 'success');
      } else {
        await createBlog(blogPayload);
        showToast(targetStatus === 'published' ? 'Blog published successfully!' : 'Blog saved as draft!', 'success');
      }

      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 700);
    } catch (err) {
      console.error('Error saving post:', err);
      showToast('Error saving blog post. Please try again.', 'error');
      if (submitPublishBtn) submitPublishBtn.disabled = false;
    }
  };

  // Publish button click
  submitPublishBtn.addEventListener('click', (e) => {
    e.preventDefault();
    savePost('published');
  });

  // Draft button click
  const draftBtn = document.getElementById('btn-draft');
  if (draftBtn) {
    draftBtn.addEventListener('click', (e) => {
      e.preventDefault();
      savePost('draft');
    });
  }
}

// ---------------------------------------------------------------------------
// 4. Lifecycle Hook
// ---------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  const currentPath = window.location.pathname.split('/').pop();

  if (currentPath === 'dashboard.html') {
    initDashboardPage();
  } else if (currentPath === 'create-blog.html') {
    initCreateBlogPage();
  }
});
