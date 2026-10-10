/**
 * BlogCraft - Authentication Module (auth.js)
 * Handles Registration, Login, Logout, Session Guards, and Validation
 */

// User storage keys match main.js
const AUTH_STORAGE = {
  USERS: 'blogcraft_users',
  CURRENT_USER: 'blogcraft_current_user'
};

// ---------------------------------------------------------------------------
// 1. Session & Auth State Management
// ---------------------------------------------------------------------------

function getUsers() {
  const users = localStorage.getItem(AUTH_STORAGE.USERS);
  return users ? JSON.parse(users) : [];
}

function saveUsers(usersList) {
  localStorage.setItem(AUTH_STORAGE.USERS, JSON.stringify(usersList));
}

function getCurrentUser() {
  const user = localStorage.getItem(AUTH_STORAGE.CURRENT_USER);
  return user ? JSON.parse(user) : null;
}

function setCurrentUser(user) {
  if (!user) return;
  // Store user without password and secrets
  const safeUser = {
    id: user.id || user._id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    stats: user.stats || null
  };
  localStorage.setItem(AUTH_STORAGE.CURRENT_USER, JSON.stringify(safeUser));
}

function logoutUser() {
  localStorage.removeItem(AUTH_STORAGE.CURRENT_USER);
  localStorage.removeItem('token');
  if (typeof cachedUserBlogs !== 'undefined') {
    cachedUserBlogs = [];
  }
  showToast('Logged out successfully.', 'info');
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 500);
}

/**
 * Route protection guard for private pages (dashboard.html, create-blog.html)
 * Verifies both token existence and user object
 */
function requireAuth() {
  const token = localStorage.getItem('token');
  const user = getCurrentUser();
  if (!token || !user) {
    // Save attempted page for intelligent redirect if needed
    const currentFile = window.location.pathname.split('/').pop();
    sessionStorage.setItem('redirect_after_login', currentFile);
    window.location.href = 'login.html?authRequired=true';
    return false;
  }
  return true;
}

/**
 * Fetch fresh user profile and statistics from the backend
 */
async function fetchCurrentUserProfile() {
  const token = localStorage.getItem('token');
  if (!token) return null;

  const res = await apiRequest('/auth/me');
  if (res.ok && res.data && res.data.success && res.data.user) {
    setCurrentUser(res.data.user);
    return res.data.user;
  }
  return null;
}

/**
 * Update authenticated user profile name
 */
async function updateUserProfile(name) {
  const res = await apiRequest('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify({ name })
  });

  if (res.ok && res.data && res.data.success && res.data.user) {
    setCurrentUser(res.data.user);
    return { success: true, user: res.data.user };
  }

  const errorMsg = (res.data && res.data.message) || 'Failed to update profile.';
  return { success: false, message: errorMsg };
}

/**
 * Prevent logged-in users from seeing login/register pages again
 */
function redirectIfLoggedIn() {
  const user = getCurrentUser();
  if (user) {
    window.location.href = 'dashboard.html';
  }
}

// ---------------------------------------------------------------------------
// 2. Validation Utilities
// ---------------------------------------------------------------------------

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(String(email).toLowerCase().trim());
}

function setFieldError(fieldId, errorMsg) {
  const inputElem = document.getElementById(fieldId);
  const errorElem = document.getElementById(`${fieldId}-error`);
  if (inputElem) {
    inputElem.classList.add('error');
    inputElem.setAttribute('aria-invalid', 'true');
  }
  if (errorElem) {
    errorElem.textContent = errorMsg;
    errorElem.style.display = 'block';
  }
}

function clearFieldError(fieldId) {
  const inputElem = document.getElementById(fieldId);
  const errorElem = document.getElementById(`${fieldId}-error`);
  if (inputElem) {
    inputElem.classList.remove('error');
    inputElem.removeAttribute('aria-invalid');
  }
  if (errorElem) {
    errorElem.textContent = '';
    errorElem.style.display = 'none';
  }
}

function clearAllErrors() {
  document.querySelectorAll('.form-input').forEach(input => {
    input.classList.remove('error');
  });
  document.querySelectorAll('.field-error-msg').forEach(msg => {
    msg.textContent = '';
    msg.style.display = 'none';
  });
}

// ---------------------------------------------------------------------------
// 3. Login Page Logic
// ---------------------------------------------------------------------------

function handleLoginForm() {
  const loginForm = document.getElementById('login-form');
  if (!loginForm) return;

  // Check if redirected because session expired or auth was required
  const urlParams = new URLSearchParams(window.location.search);
  const sessionBanner = document.getElementById('session-alert-banner');

  if (urlParams.get('sessionExpired') === 'true') {
    showToast('Your session has expired or is invalid. Please sign in again.', 'warning', 4500);
    if (sessionBanner) {
      sessionBanner.textContent = '⏱️ Your session has expired or is invalid. Please sign in again to continue.';
      sessionBanner.style.display = 'block';
    }
  } else if (urlParams.get('authRequired') === 'true') {
    showToast('Please sign in to access that page.', 'warning', 3500);
    if (sessionBanner) {
      sessionBanner.textContent = '🔒 Authentication required: Please sign in to access your author dashboard.';
      sessionBanner.style.display = 'block';
    }
  }

  // Pre-fill demo button
  const fillDemoBtn = document.getElementById('fill-demo-btn');
  if (fillDemoBtn) {
    fillDemoBtn.addEventListener('click', () => {
      document.getElementById('email').value = 'demo@example.com';
      document.getElementById('password').value = 'password123';
      clearAllErrors();
      showToast('Demo credentials filled!', 'info', 2000);
    });
  }

  // Toggle password visibility
  const togglePassBtn = document.getElementById('toggle-password');
  if (togglePassBtn) {
    togglePassBtn.addEventListener('click', () => {
      const passInput = document.getElementById('password');
      const isPass = passInput.type === 'password';
      passInput.type = isPass ? 'text' : 'password';
      togglePassBtn.textContent = isPass ? '🙈' : '👁️';
    });
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAllErrors();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    let hasError = false;

    // Email validation
    if (!email) {
      setFieldError('email', 'Email address is required.');
      hasError = true;
    } else if (!isValidEmail(email)) {
      setFieldError('email', 'Please enter a valid email address.');
      hasError = true;
    }

    // Password validation
    if (!password) {
      setFieldError('password', 'Password is required.');
      hasError = true;
    }

    if (hasError) {
      showToast('Please fix the errors in the form.', 'error');
      return;
    }

    const submitBtn = document.getElementById('login-submit-btn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Signing in...';
    }

    try {
      // 1. Call Express Backend POST /api/auth/login
      const res = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      if (res.ok && res.data.success) {
        // Store JWT token and current user
        localStorage.setItem('token', res.data.token);
        setCurrentUser(res.data.user);
        showToast(`Welcome back, ${res.data.user.name}!`, 'success', 2500);

        const redirectTarget = sessionStorage.getItem('redirect_after_login') || 'dashboard.html';
        sessionStorage.removeItem('redirect_after_login');

        setTimeout(() => {
          window.location.href = redirectTarget;
        }, 700);
        return;
      }

      // Check specific error status from backend
      if (res.status === 401) {
        setFieldError('email', 'Invalid email or password.');
        setFieldError('password', 'Invalid email or password.');
        showToast(res.data.message || 'Invalid email or password.', 'error');
      } else {
        showToast(res.data.message || 'Login failed. Please try again.', 'error');
      }
    } catch (err) {
      console.error('Login error:', err);
      showToast('An unexpected error occurred during login.', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In to Dashboard';
      }
    }
  });
}

// ---------------------------------------------------------------------------
// 4. Registration Page Logic
// ---------------------------------------------------------------------------

function handleRegisterForm() {
  const registerForm = document.getElementById('register-form');
  if (!registerForm) return;

  // Toggle password visibility
  const togglePassBtn = document.getElementById('toggle-password');
  if (togglePassBtn) {
    togglePassBtn.addEventListener('click', () => {
      const passInput = document.getElementById('password');
      const isPass = passInput.type === 'password';
      passInput.type = isPass ? 'text' : 'password';
      togglePassBtn.textContent = isPass ? '🙈' : '👁️';
    });
  }

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAllErrors();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    let hasError = false;

    // Name validation
    if (!name) {
      setFieldError('name', 'Full name is required.');
      hasError = true;
    } else if (name.length < 2) {
      setFieldError('name', 'Name must be at least 2 characters.');
      hasError = true;
    }

    // Email validation
    if (!email) {
      setFieldError('email', 'Email address is required.');
      hasError = true;
    } else if (!isValidEmail(email)) {
      setFieldError('email', 'Please enter a valid email address.');
      hasError = true;
    }

    // Password validation (min 6 characters)
    if (!password) {
      setFieldError('password', 'Password is required.');
      hasError = true;
    } else if (password.length < 6) {
      setFieldError('password', 'Password must be at least 6 characters.');
      hasError = true;
    }

    // Confirm Password validation
    if (!confirmPassword) {
      setFieldError('confirmPassword', 'Please confirm your password.');
      hasError = true;
    } else if (password !== confirmPassword) {
      setFieldError('confirmPassword', 'Passwords do not match.');
      hasError = true;
    }

    if (hasError) {
      showToast('Please correct the highlighted errors.', 'error');
      return;
    }

    const submitBtn = document.getElementById('register-submit-btn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Creating account...';
    }

    try {
      // Call Express Backend POST /api/auth/register
      const res = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password })
      });

      if (res.ok && res.data.success) {
        showToast('Registration successful! Redirecting to login...', 'success', 2500);
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 1200);
        return;
      }

      if (res.status === 409) {
        setFieldError('email', 'An account with this email already exists.');
        showToast(res.data.message || 'Email already registered. Please login.', 'warning');
      } else {
        showToast(res.data.message || 'Registration failed. Please try again.', 'error');
      }
    } catch (err) {
      console.error('Registration error:', err);
      showToast('An unexpected error occurred during registration.', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Author Account';
      }
    }
  });
}

// ---------------------------------------------------------------------------
// 5. Lifecycle Initialization
// ---------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  const currentPath = window.location.pathname.split('/').pop();

  if (currentPath === 'login.html') {
    redirectIfLoggedIn();
    handleLoginForm();
  } else if (currentPath === 'register.html') {
    redirectIfLoggedIn();
    handleRegisterForm();
  }
});
