/**
 * BlogCraft - Blog Management & Homepage Operations (blog.js)
 * Manages Blog CRUD, Filtering, Instant Search, Reader Modal, and Individual Blog Linking
 * Connected to MongoDB REST API Backend
 */

// Storage key matches main.js
const BLOG_STORAGE_KEY = 'blogcraft_blogs';

// ---------------------------------------------------------------------------
// 1. Data Store Operations (MongoDB via Express REST API)
// ---------------------------------------------------------------------------

// In-memory cache synced with backend
let cachedBlogs = [];

function getBlogAuthorName(blog) {
  if (!blog) return 'Author';
  if (blog.author && typeof blog.author === 'object' && blog.author.name) {
    return blog.author.name;
  }
  return blog.authorName || (typeof blog.author === 'string' ? blog.author : 'Author');
}

function getBlogId(blog) {
  if (!blog) return '';
  return blog._id || blog.id || '';
}

async function getBlogsAsync(filters = {}) {
  // Query Express backend GET /api/blogs (retrieves from MongoDB)
  const queryParams = new URLSearchParams();
  if (filters.category && filters.category !== 'All') queryParams.set('category', filters.category);
  if (filters.search) queryParams.set('search', filters.search);
  if (filters.status) queryParams.set('status', filters.status);
  if (filters.authorId) queryParams.set('authorId', filters.authorId);

  const queryStr = queryParams.toString() ? `?${queryParams.toString()}` : '';
  const res = await apiRequest(`/blogs${queryStr}`);

  if (res.ok && res.data && res.data.success && Array.isArray(res.data.blogs)) {
    cachedBlogs = res.data.blogs;
    return cachedBlogs;
  }

  console.warn('Could not retrieve blogs from MongoDB backend:', (res.data && res.data.message) || 'Server unavailable');
  return [];
}

function getBlogs() {
  return cachedBlogs;
}

async function getBlogByIdAsync(id) {
  const res = await apiRequest(`/blogs/${encodeURIComponent(id)}`);
  if (res.ok && res.data && res.data.success && res.data.blog) {
    return res.data.blog;
  }
  return null;
}

function getBlogById(id) {
  return cachedBlogs.find(b => String(b._id || b.id) === String(id)) || null;
}

async function createBlog(data) {
  const res = await apiRequest('/blogs', {
    method: 'POST',
    body: JSON.stringify(data)
  });

  if (res.ok && res.data && res.data.success && res.data.blog) {
    await getBlogsAsync(); // Refresh cache from MongoDB
    return res.data.blog;
  }

  const errorMsg = (res.data && res.data.message) || 'Failed to create blog in database.';
  throw new Error(errorMsg);
}

async function updateBlog(id, updatedFields) {
  const res = await apiRequest(`/blogs/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(updatedFields)
  });

  if (res.ok && res.data && res.data.success && res.data.blog) {
    await getBlogsAsync();
    return res.data.blog;
  }

  const errorMsg = (res.data && res.data.message) || 'Failed to update blog in database.';
  throw new Error(errorMsg);
}

async function deleteBlog(id) {
  const res = await apiRequest(`/blogs/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });

  if (res.ok && res.data && res.data.success) {
    await getBlogsAsync();
    return true;
  }

  const errorMsg = (res.data && res.data.message) || 'Failed to delete blog in database.';
  throw new Error(errorMsg);
}

// ---------------------------------------------------------------------------
// 2. Homepage UI Rendering
// ---------------------------------------------------------------------------

let activeCategory = 'All';
let searchQuery = '';

async function initHomePage() {
  const blogsGrid = document.getElementById('recent-blogs-grid');
  if (!blogsGrid) return; // Not on home page

  setupSearchAndFilters();
  setupReaderModal();
  await renderHomeContent();
}

async function renderHomeContent() {
  const allBlogs = await getBlogsAsync();
  // On homepage, only display published blogs to public readers
  const publishedBlogs = allBlogs.filter(b => b.status === 'published');

  // Filter based on active category & search query
  const filteredBlogs = publishedBlogs.filter(blog => {
    const matchesCategory = (activeCategory === 'All') || 
      (blog.category.toLowerCase() === activeCategory.toLowerCase());

    const query = searchQuery.toLowerCase().trim();
    const authorName = getBlogAuthorName(blog);
    const matchesSearch = !query || 
      blog.title.toLowerCase().includes(query) ||
      blog.description.toLowerCase().includes(query) ||
      blog.category.toLowerCase().includes(query) ||
      authorName.toLowerCase().includes(query);

    return matchesCategory && matchesSearch;
  });

  // Render Featured Post
  renderFeaturedSection(publishedBlogs, searchQuery, activeCategory);

  // Render Grid
  renderBlogsGrid(filteredBlogs);
}

function renderFeaturedSection(publishedBlogs, currentQuery, currentCat) {
  const featuredContainer = document.getElementById('featured-blog-container');
  if (!featuredContainer) return;

  // Only show featured section if no active search/category filter is applied, or if matches exist
  if (currentQuery || currentCat !== 'All') {
    featuredContainer.style.display = 'none';
    return;
  }

  // Find explicit featured blog or first published blog
  const featuredBlog = publishedBlogs.find(b => b.featured) || publishedBlogs[0];

  if (!featuredBlog) {
    featuredContainer.style.display = 'none';
    return;
  }

  const blogId = getBlogId(featuredBlog);
  const authorName = getBlogAuthorName(featuredBlog);
  const authorInitial = authorName.charAt(0).toUpperCase();
  const displayDate = featuredBlog.date || (featuredBlog.createdAt ? new Date(featuredBlog.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'Recent');

  featuredContainer.style.display = 'block';
  featuredContainer.innerHTML = `
    <div class="featured-card">
      <div class="featured-img-wrap">
        <a href="blog.html?id=${encodeURIComponent(blogId)}">
          <img src="${escapeHtml(featuredBlog.image)}" 
               alt="${escapeHtml(featuredBlog.title)}" 
               loading="lazy"
               onerror="this.src='https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=800&q=80'">
        </a>
      </div>
      <div class="featured-content">
        <div class="featured-meta">
          <span class="badge badge-primary">${escapeHtml(featuredBlog.category)}</span>
          <span class="badge badge-warning">★ Featured Story</span>
        </div>
        <h3 class="featured-title">
          <a href="blog.html?id=${encodeURIComponent(blogId)}">${escapeHtml(featuredBlog.title)}</a>
        </h3>
        <p class="featured-desc">${escapeHtml(featuredBlog.description)}</p>
        <div class="post-author-row">
          <div class="author-info">
            <div class="author-avatar">${authorInitial}</div>
            <div>
              <div class="author-name">${escapeHtml(authorName)}</div>
              <div class="post-date">${escapeHtml(displayDate)}</div>
            </div>
          </div>
          <div style="display:flex; gap:0.5rem; align-items:center;">
            <button class="btn btn-secondary btn-sm" onclick="openReaderModal('${blogId}')" title="Quick Preview">
              Quick View
            </button>
            <a href="blog.html?id=${encodeURIComponent(blogId)}" class="btn btn-primary btn-sm">
              Read Article &rarr;
            </a>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderBlogsGrid(blogs) {
  const gridContainer = document.getElementById('recent-blogs-grid');
  if (!gridContainer) return;

  if (blogs.length === 0) {
    gridContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <h3 class="empty-state-title">No matching blog posts found</h3>
        <p class="empty-state-desc">Try searching with different keywords or switch back to "All Categories".</p>
        <button class="btn btn-secondary btn-sm" onclick="resetFilters()">Reset All Filters</button>
      </div>
    `;
    return;
  }

  gridContainer.innerHTML = blogs.map(blog => {
    const blogId = getBlogId(blog);
    const authorName = getBlogAuthorName(blog);
    const authorInitial = authorName.charAt(0).toUpperCase();
    const displayDate = blog.date || (blog.createdAt ? new Date(blog.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'Recent');

    return `
      <article class="blog-card" id="blog-card-${blogId}">
        <div class="card-img-wrap">
          <span class="badge badge-primary card-badge">${escapeHtml(blog.category)}</span>
          <a href="blog.html?id=${encodeURIComponent(blogId)}">
            <img src="${escapeHtml(blog.image)}" 
                 alt="${escapeHtml(blog.title)}" 
                 loading="lazy"
                 onerror="this.src='https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=800&q=80'">
          </a>
        </div>
        <div class="card-content">
          <h3 class="card-title">
            <a href="blog.html?id=${encodeURIComponent(blogId)}">${escapeHtml(blog.title)}</a>
          </h3>
          <p class="card-desc">${escapeHtml(blog.description)}</p>
          <div class="card-footer">
            <div class="author-info">
              <div class="author-avatar" style="width:30px; height:30px; font-size:0.75rem;">
                ${authorInitial}
              </div>
              <div>
                <div class="author-name" style="font-size:0.8rem;">${escapeHtml(authorName)}</div>
                <div class="post-date" style="font-size:0.725rem;">${escapeHtml(displayDate)}</div>
              </div>
            </div>
            <div style="display:flex; gap:0.35rem; align-items:center;">
              <button class="card-readmore-btn" onclick="openReaderModal('${blogId}')" title="Quick Read">
                Preview
              </button>
              <a href="blog.html?id=${encodeURIComponent(blogId)}" class="card-readmore-btn" style="color:var(--primary); font-weight:700;">
                Read &rarr;
              </a>
            </div>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

// ---------------------------------------------------------------------------
// 3. Search and Category Filter Setup
// ---------------------------------------------------------------------------

function setupSearchAndFilters() {
  const searchInput = document.getElementById('search-blogs-input');
  const clearBtn = document.getElementById('clear-search-btn');
  const categoryPills = document.querySelectorAll('.category-pill');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      if (clearBtn) {
        clearBtn.style.display = searchQuery.length > 0 ? 'block' : 'none';
      }
      renderHomeContent();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      searchQuery = '';
      clearBtn.style.display = 'none';
      renderHomeContent();
      if (searchInput) searchInput.focus();
    });
  }

  categoryPills.forEach(pill => {
    pill.addEventListener('click', () => {
      categoryPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeCategory = pill.getAttribute('data-category') || 'All';
      renderHomeContent();
    });
  });
}

function resetFilters() {
  const searchInput = document.getElementById('search-blogs-input');
  const clearBtn = document.getElementById('clear-search-btn');
  const categoryPills = document.querySelectorAll('.category-pill');

  if (searchInput) searchInput.value = '';
  searchQuery = '';
  if (clearBtn) clearBtn.style.display = 'none';

  categoryPills.forEach(p => {
    if (p.getAttribute('data-category') === 'All') {
      p.classList.add('active');
    } else {
      p.classList.remove('active');
    }
  });
  activeCategory = 'All';

  renderHomeContent();
}

// ---------------------------------------------------------------------------
// 4. Blog Reader Modal Dialog
// ---------------------------------------------------------------------------

function setupReaderModal() {
  let modal = document.getElementById('blog-reader-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'blog-reader-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-dialog modal-large" role="dialog" aria-modal="true" aria-labelledby="reader-title">
        <div class="modal-header">
          <span class="badge badge-primary" id="reader-category">Category</span>
          <button class="modal-close-btn" id="reader-close-btn" aria-label="Close reader">&times;</button>
        </div>
        <div class="modal-body" id="reader-body">
          <img id="reader-img" class="modal-article-img" src="" alt="" onerror="this.style.display='none'">
          <div class="modal-article-meta">
            <div class="author-avatar" id="reader-avatar">D</div>
            <div>
              <strong id="reader-author" style="display:block; font-size:0.95rem;">Author</strong>
              <span id="reader-date" style="font-size:0.8rem; color:var(--text-muted);">Date</span>
            </div>
          </div>
          <h2 class="modal-article-title" id="reader-title">Blog Title</h2>
          <div class="modal-article-content" id="reader-content"></div>
        </div>
        <div class="modal-footer" style="display:flex; justify-content:space-between; align-items:center;">
          <a href="#" id="reader-full-page-link" class="btn btn-primary btn-sm">Open Dedicated Page &rarr;</a>
          <button class="btn btn-secondary btn-sm" id="reader-done-btn">Close Article</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const closeHandler = () => modal.classList.remove('active');
    document.getElementById('reader-close-btn').addEventListener('click', closeHandler);
    document.getElementById('reader-done-btn').addEventListener('click', closeHandler);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeHandler();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeHandler();
      }
    });
  }
}

async function openReaderModal(blogId) {
  const blog = await getBlogByIdAsync(blogId) || getBlogById(blogId);
  if (!blog) {
    showToast('Blog post not found.', 'error');
    return;
  }

  setupReaderModal();
  const modal = document.getElementById('blog-reader-modal');

  const authorName = getBlogAuthorName(blog);
  const authorInitial = authorName.charAt(0).toUpperCase();
  const displayDate = blog.date || (blog.createdAt ? new Date(blog.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'Recent');
  const actualId = getBlogId(blog);

  document.getElementById('reader-category').textContent = blog.category;
  document.getElementById('reader-title').textContent = blog.title;
  document.getElementById('reader-author').textContent = authorName;
  document.getElementById('reader-date').textContent = displayDate;
  document.getElementById('reader-avatar').textContent = authorInitial;

  const fullPageLink = document.getElementById('reader-full-page-link');
  if (fullPageLink) {
    fullPageLink.href = `blog.html?id=${encodeURIComponent(actualId)}`;
  }

  const imgElem = document.getElementById('reader-img');
  imgElem.style.display = 'block';
  imgElem.src = blog.image;
  imgElem.alt = blog.title;

  // Format content paragraphs
  const contentContainer = document.getElementById('reader-content');
  const paragraphs = (blog.content || '').split('\n\n').filter(p => p.trim());
  contentContainer.innerHTML = paragraphs.map(p => {
    const formatted = escapeHtml(p).replace(/\n/g, '<br>');
    return `<p>${formatted}</p>`;
  }).join('');

  modal.classList.add('active');
}

// ---------------------------------------------------------------------------
// 5. Lifecycle Initialization
// ---------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  const currentPath = window.location.pathname.split('/').pop();
  if (currentPath === '' || currentPath === 'index.html') {
    initHomePage();
  }
});
