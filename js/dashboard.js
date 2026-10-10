/**
 * BlogCraft - Dashboard & Blog Editor Module (dashboard.js)
 * Manages Dashboard Statistics, Blog Table, Deletion Modals, User Profile, and Create/Edit Form
 * Strictly connects to authenticated endpoints (GET /api/blogs/my, GET/PUT /api/auth/profile)
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
  setupProfileModal();

  // Load fresh profile data and author blogs in parallel
  await Promise.all([
    loadFreshUserProfile(),
    refreshDashboardData()
  ]);
}

async function loadFreshUserProfile() {
  if (typeof fetchCurrentUserProfile === 'function') {
    const freshUser = await fetchCurrentUserProfile();
    if (freshUser) {
      populateUserProfile(freshUser);
    }
  }
}

async function refreshDashboardData(filterQuery = '') {
  const tableBody = document.getElementById('dashboard-table-body');
  if (tableBody) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center; padding: 2.5rem 1rem;">
          <div style="font-size: 1.5rem; margin-bottom: 0.5rem; animation: pulse 1.5s infinite;">⏳</div>
          <p style="color: var(--text-muted); font-size: 0.9rem;">Fetching your articles from server...</p>
        </td>
      </tr>
    `;
  }

  const { blogs, stats } = await getUserDashboardBlogsAsync({ search: filterQuery });
  renderDashboardStats(stats);
  renderDashboardTable(blogs, filterQuery);
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

  // Populate Member Since badge in profile modal
  const memberSinceEl = document.getElementById('profile-member-since');
  if (memberSinceEl) {
    if (user.createdAt) {
      const createdDate = new Date(user.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      memberSinceEl.textContent = `Member since: ${createdDate}`;
    } else {
      memberSinceEl.textContent = 'Active Author';
    }
  }

  // Pre-fill profile modal form inputs
  const nameInput = document.getElementById('profile-name-input');
  if (nameInput) nameInput.value = user.name || '';

  const emailInput = document.getElementById('profile-email-input');
  if (emailInput) emailInput.value = user.email || '';

  // Update profile modal stat counters if stats exist
  if (user.stats) {
    const profTotal = document.getElementById('profile-stat-total');
    const profPub = document.getElementById('profile-stat-published');
    const profDraft = document.getElementById('profile-stat-drafts');
    if (profTotal) profTotal.textContent = user.stats.total || 0;
    if (profPub) profPub.textContent = user.stats.published || 0;
    if (profDraft) profDraft.textContent = user.stats.drafts || 0;
  }
}

function renderDashboardStats(stats) {
  const currentStats = stats || getUserDashboardStats();
  const blogs = getUserDashboardBlogs();

  const total = (currentStats && currentStats.total !== undefined) ? currentStats.total : blogs.length;
  const published = (currentStats && currentStats.published !== undefined) ? currentStats.published : blogs.filter(b => b.status === 'published').length;
  const drafts = (currentStats && currentStats.drafts !== undefined) ? currentStats.drafts : blogs.filter(b => b.status === 'draft').length;

  const totalEl = document.getElementById('stat-total-blogs');
  const publishedEl = document.getElementById('stat-published-blogs');
  const draftsEl = document.getElementById('stat-drafts-blogs');

  if (totalEl) totalEl.textContent = total;
  if (publishedEl) publishedEl.textContent = published;
  if (draftsEl) draftsEl.textContent = drafts;

  // Also sync profile modal stats
  const profTotal = document.getElementById('profile-stat-total');
  const profPub = document.getElementById('profile-stat-published');
  const profDraft = document.getElementById('profile-stat-drafts');
  if (profTotal) profTotal.textContent = total;
  if (profPub) profPub.textContent = published;
  if (profDraft) profDraft.textContent = drafts;
}

function renderDashboardTable(blogsList, filterQuery = '') {
  const tableBody = document.getElementById('dashboard-table-body');
  if (!tableBody) return;

  const blogs = blogsList !== undefined ? blogsList : getUserDashboardBlogs();
  const query = filterQuery.toLowerCase().trim();

  if (!blogs || blogs.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center; padding: 3rem 1rem;">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">📝</div>
          <p style="font-weight: 600; color: var(--text-primary);">No articles found</p>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">
            ${query ? 'No results matched your search keyword.' : 'You haven\'t created any articles yet.'}
          </p>
          <a href="create-blog.html" class="btn btn-primary btn-sm">+ Create Your First Blog</a>
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = blogs.map(blog => {
    const blogId = blog._id || blog.id;
    const isPublished = blog.status === 'published';
    const statusBadge = isPublished
      ? `<span class="badge badge-success" title="Published online">● Published</span>`
      : `<span class="badge badge-warning" title="Saved as draft">○ Draft</span>`;

    const authorName = (typeof blog.author === 'object' && blog.author !== null)
      ? (blog.author.name || 'You')
      : (blog.authorName || 'You');

    const formattedDate = typeof formatDate === 'function'
      ? formatDate(blog.createdAt ? new Date(blog.createdAt) : new Date(blog.date))
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

let searchDebounceTimer = null;
function setupDashboardSearch() {
  const searchInput = document.getElementById('dashboard-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => {
        refreshDashboardData(e.target.value);
      }, 300);
    });
  }
}

// ---------------------------------------------------------------------------
// 2. Author Profile Modal Management (Module 5 Profile)
// ---------------------------------------------------------------------------

function openProfileModal() {
  const modal = document.getElementById('profile-modal');
  if (!modal) return;

  const currentUser = getCurrentUser();
  if (currentUser) {
    populateUserProfile(currentUser);
  }

  const nameInput = document.getElementById('profile-name-input');
  if (nameInput) {
    nameInput.focus();
  }

  modal.classList.add('active');
}

function closeProfileModal() {
  const modal = document.getElementById('profile-modal');
  if (modal) {
    modal.classList.remove('active');
  }
  const errorElem = document.getElementById('profile-name-error');
  if (errorElem) {
    errorElem.style.display = 'none';
  }
}

function setupProfileModal() {
  const modal = document.getElementById('profile-modal');
  if (!modal) return;

  const closeBtn = document.getElementById('profile-modal-close');
  const cancelBtn = document.getElementById('profile-modal-cancel');
  const saveBtn = document.getElementById('profile-modal-save');
  const nameInput = document.getElementById('profile-name-input');
  const errorElem = document.getElementById('profile-name-error');

  if (closeBtn) closeBtn.addEventListener('click', closeProfileModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeProfileModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeProfileModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeProfileModal();
    }
  });

  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const newName = nameInput ? nameInput.value.trim() : '';

      if (!newName || newName.length < 2) {
        if (errorElem) {
          errorElem.textContent = 'Name must be at least 2 characters long.';
          errorElem.style.display = 'block';
        }
        return;
      }

      if (errorElem) errorElem.style.display = 'none';
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';

      try {
        const result = await updateUserProfile(newName);
        if (result.success) {
          showToast('Profile updated successfully!', 'success');
          populateUserProfile(result.user);
          closeProfileModal();
          // Also refresh dashboard table to reflect new author name
          await refreshDashboardData();
        } else {
          showToast(result.message || 'Failed to update profile.', 'error');
        }
      } catch (err) {
        console.error('Profile update error:', err);
        showToast('Error updating profile.', 'error');
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Profile Changes';
      }
    });
  }
}

// ---------------------------------------------------------------------------
// 3. Delete Confirmation Modal
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
// 4. Create & Edit Blog Form Logic (create-blog.html)
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
// 5. Lifecycle Hook
// ---------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  const currentPath = window.location.pathname.split('/').pop();

  if (currentPath === 'dashboard.html') {
    initDashboardPage();
  } else if (currentPath === 'create-blog.html') {
    initCreateBlogPage();
  }
});
