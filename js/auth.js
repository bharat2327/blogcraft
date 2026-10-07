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
  // Store user without password
  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email
  };
  localStorage.setItem(AUTH_STORAGE.CURRENT_USER, JSON.stringify(safeUser));
}

function logoutUser() {
  localStorage.removeItem(AUTH_STORAGE.CURRENT_USER);
  showToast('Logged out successfully.', 'info');
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 500);
}

/**
 * Route protection guard for private pages (dashboard.html, create-blog.html)
 */
function requireAuth() {
  const user = getCurrentUser();
  if (!user) {
    // Save attempted page for intelligent redirect if needed
    const currentFile = window.location.pathname.split('/').pop();
    sessionStorage.setItem('redirect_after_login', currentFile);
    window.location.href = 'login.html?authRequired=true';
    return false;
  }
  return true;
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

  // Check if redirected because auth was required
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('authRequired') === 'true') {
    showToast('Please sign in to access that page.', 'warning');
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

  loginForm.addEventListener('submit', (e) => {
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

    // Authenticate against localStorage users
    const users = getUsers();
    const matchedUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!matchedUser) {
      setFieldError('email', 'No account found with this email.');
      showToast('Account not found. Please register first.', 'error');
      return;
    }

    if (matchedUser.password !== password) {
      setFieldError('password', 'Incorrect password. Try again.');
      showToast('Invalid email or password.', 'error');
      return;
    }

    // Successful login
    setCurrentUser(matchedUser);
    showToast(`Welcome back, ${matchedUser.name}!`, 'success', 2500);

    const redirectTarget = sessionStorage.getItem('redirect_after_login') || 'dashboard.html';
    sessionStorage.removeItem('redirect_after_login');

    setTimeout(() => {
      window.location.href = redirectTarget;
    }, 700);
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

  registerForm.addEventListener('submit', (e) => {
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

    // Check if email already registered
    const users = getUsers();
    const emailExists = users.some(u => u.email.toLowerCase() === email.toLowerCase());

    if (emailExists) {
      setFieldError('email', 'An account with this email already exists.');
      showToast('Email is already registered. Please login.', 'warning');
      return;
    }

    // Create new user object
    const newUser = {
      id: Date.now(),
      name: name,
      email: email,
      password: password
    };

    users.push(newUser);
    saveUsers(users);

    showToast('Registration successful! Redirecting to login...', 'success', 2500);

    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1200);
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
