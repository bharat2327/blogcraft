/**
 * BlogCraft - Blog Management & Homepage Operations (blog.js)
 * Manages Blog CRUD, Filtering, Instant Search, and Reader Modal
 */

// Storage key matches main.js
const BLOG_STORAGE_KEY = 'blogcraft_blogs';

// ---------------------------------------------------------------------------
// 1. Data Store Operations
// ---------------------------------------------------------------------------

function getBlogs() {
  const blogs = localStorage.getItem(BLOG_STORAGE_KEY);
  return blogs ? JSON.parse(blogs) : [];
}

function saveBlogs(blogsList) {
  localStorage.setItem(BLOG_STORAGE_KEY, JSON.stringify(blogsList));
}

function getBlogById(id) {
  const blogs = getBlogs();
  return blogs.find(b => String(b.id) === String(id)) || null;
}

function createBlog(data) {
  const blogs = getBlogs();
  const currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || '{}');
  
  const newBlog = {
    id: Date.now(),
    title: data.title.trim(),
    category: data.category.trim(),
    image: data.image.trim() || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=800&q=80',
    description: data.description.trim(),
    content: data.content.trim(),
    author: currentUser.name || 'Anonymous Author',
    date: formatDate(new Date()),
    status: data.status || 'published',
    featured: false
  };

  blogs.unshift(newBlog);
  saveBlogs(blogs);
  return newBlog;
}

function updateBlog(id, updatedFields) {
  const blogs = getBlogs();
  const index = blogs.findIndex(b => String(b.id) === String(id));
  if (index === -1) return null;

  blogs[index] = {
    ...blogs[index],
    ...updatedFields,
    updatedAt: formatDate(new Date())
  };

  saveBlogs(blogs);
  return blogs[index];
}

function deleteBlog(id) {
  let blogs = getBlogs();
  blogs = blogs.filter(b => String(b.id) !== String(id));
  saveBlogs(blogs);
  return true;
}

// ---------------------------------------------------------------------------
// 2. Homepage UI Rendering
// ---------------------------------------------------------------------------

let activeCategory = 'All';
let searchQuery = '';

function initHomePage() {
  const blogsGrid = document.getElementById('recent-blogs-grid');
  if (!blogsGrid) return; // Not on home page

  setupSearchAndFilters();
  renderHomeContent();
  setupReaderModal();
}

function renderHomeContent() {
  const allBlogs = getBlogs();
  // On homepage, only display published blogs to public readers
  const publishedBlogs = allBlogs.filter(b => b.status === 'published');

  // Filter based on active category & search query
  const filteredBlogs = publishedBlogs.filter(blog => {
    const matchesCategory = (activeCategory === 'All') || 
      (blog.category.toLowerCase() === activeCategory.toLowerCase());

    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || 
      blog.title.toLowerCase().includes(query) ||
      blog.description.toLowerCase().includes(query) ||
      blog.category.toLowerCase().includes(query) ||
      blog.author.toLowerCase().includes(query);

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

  featuredContainer.style.display = 'block';
  featuredContainer.innerHTML = `
    <div class="featured-card">
      <div class="featured-img-wrap">
        <img src="${escapeHtml(featuredBlog.image)}" 
             alt="${escapeHtml(featuredBlog.title)}" 
             loading="lazy"
             onerror="this.src='https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=800&q=80'">
      </div>
      <div class="featured-content">
        <div class="featured-meta">
          <span class="badge badge-primary">${escapeHtml(featuredBlog.category)}</span>
          <span class="badge badge-warning">★ Featured Story</span>
        </div>
        <h3 class="featured-title">
          <a href="javascript:void(0)" onclick="openReaderModal(${featuredBlog.id})">${escapeHtml(featuredBlog.title)}</a>
        </h3>
        <p class="featured-desc">${escapeHtml(featuredBlog.description)}</p>
        <div class="post-author-row">
          <div class="author-info">
            <div class="author-avatar">${featuredBlog.author.charAt(0).toUpperCase()}</div>
            <div>
              <div class="author-name">${escapeHtml(featuredBlog.author)}</div>
              <div class="post-date">${escapeHtml(featuredBlog.date)}</div>
            </div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="openReaderModal(${featuredBlog.id})">
            Read Full Article &rarr;
          </button>
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

  gridContainer.innerHTML = blogs.map(blog => `
    <article class="blog-card" id="blog-card-${blog.id}">
      <div class="card-img-wrap">
        <span class="badge badge-primary card-badge">${escapeHtml(blog.category)}</span>
        <img src="${escapeHtml(blog.image)}" 
             alt="${escapeHtml(blog.title)}" 
             loading="lazy"
             onerror="this.src='https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=800&q=80'">
      </div>
      <div class="card-content">
        <h3 class="card-title">
          <a href="javascript:void(0)" onclick="openReaderModal(${blog.id})">${escapeHtml(blog.title)}</a>
        </h3>
        <p class="card-desc">${escapeHtml(blog.description)}</p>
        <div class="card-footer">
          <div class="author-info">
            <div class="author-avatar" style="width:30px; height:30px; font-size:0.75rem;">
              ${blog.author.charAt(0).toUpperCase()}
            </div>
            <div>
              <div class="author-name" style="font-size:0.8rem;">${escapeHtml(blog.author)}</div>
              <div class="post-date" style="font-size:0.725rem;">${escapeHtml(blog.date)}</div>
            </div>
          </div>
          <button class="card-readmore-btn" onclick="openReaderModal(${blog.id})">
            Read More &rarr;
          </button>
        </div>
      </div>
    </article>
  `).join('');
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
        <div class="modal-footer">
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

function openReaderModal(blogId) {
  const blog = getBlogById(blogId);
  if (!blog) {
    showToast('Blog post not found.', 'error');
    return;
  }

  setupReaderModal();
  const modal = document.getElementById('blog-reader-modal');

  document.getElementById('reader-category').textContent = blog.category;
  document.getElementById('reader-title').textContent = blog.title;
  document.getElementById('reader-author').textContent = blog.author;
  document.getElementById('reader-date').textContent = blog.date;
  document.getElementById('reader-avatar').textContent = blog.author.charAt(0).toUpperCase();

  const imgElem = document.getElementById('reader-img');
  imgElem.style.display = 'block';
  imgElem.src = blog.image;
  imgElem.alt = blog.title;

  // Format content paragraphs
  const contentContainer = document.getElementById('reader-content');
  const paragraphs = blog.content.split('\n\n').filter(p => p.trim());
  contentContainer.innerHTML = paragraphs.map(p => {
    // Preserve line breaks within paragraph if any
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
