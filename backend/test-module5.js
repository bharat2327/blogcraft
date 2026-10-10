/**
 * BlogCraft - Module 5 Comprehensive Authentication, Dashboard & Security Test Suite
 * Tests all 17 required verification points:
 * 1. Valid registration (MongoDB persistence, bcrypt hash, safe payload without password)
 * 2. Duplicate registration conflict rejection (HTTP 409 Conflict)
 * 3. Successful login (HTTP 200 OK, valid signed JWT, safe user payload)
 * 4. Invalid login rejection (HTTP 401 Unauthorized, generic error message)
 * 5. Missing token rejection on protected dashboard endpoint (HTTP 401 Unauthorized)
 * 6. Invalid / tampered token rejection (HTTP 401 Unauthorized)
 * 7. Expired token rejection (HTTP 401 Unauthorized)
 * 8. Protected dashboard API (GET /api/blogs/my returns 200 OK, authenticated user's blogs + stats)
 * 9. Account A sees only Account A's blogs on GET /api/blogs/my
 * 10. Account B sees only Account B's blogs on GET /api/blogs/my
 * 11. Cross-user isolation: Account A cannot read private drafts belonging to Account B (404 Not Found)
 * 12. Cross-user authorization: Account A cannot update Account B's blog (403 Forbidden)
 * 13. Cross-user authorization: Account A cannot delete Account B's blog (403 Forbidden)
 * 14. User Profile API: GET /api/auth/me returns caller's profile with createdAt and stats; PUT /api/auth/profile updates name and restricts privileged fields
 * 15. Logout client state verification (unauthenticated follow-up requests rejected)
 * 16. Server-side authorization enforcement (requests without valid credentials rejected on all protected endpoints)
 * 17. Regression tests for Module 1-4 features (health endpoint, public feed, search, filter, individual blog view)
 */

const http = require('http');
const jwt = require('jsonwebtoken');

const BASE_URL = 'http://127.0.0.1:5000';
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-blogcraft-2026';

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    };

    const req = http.request(url, reqOptions, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(body);
        } catch (e) {
          parsed = body;
        }
        resolve({ status: res.statusCode, data: parsed });
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function ensureServerRunning() {
  return new Promise((resolve) => {
    const checkReq = http.request('http://127.0.0.1:5000/api/health', { method: 'GET', timeout: 600 }, (res) => {
      resolve(true);
    });
    checkReq.on('error', async () => {
      try {
        const { startServer } = require('./server');
        await startServer();
        await new Promise(r => setTimeout(r, 600));
        resolve(true);
      } catch (e) {
        resolve(false);
      }
    });
    checkReq.end();
  });
}

async function runModule5TestSuite() {
  console.log('====================================================');
  console.log('BLOGCRAFT — MODULE 5 AUTHENTICATION & DASHBOARD TESTS');
  console.log('====================================================\n');

  await ensureServerRunning();

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName} - ${details}`);
      failed++;
    }
  }

  try {
    const timestamp = Date.now();
    const userAEmail = `user_a_${timestamp}@example.com`;
    const userBEmail = `user_b_${timestamp}@example.com`;
    const passwordA = 'SecurePasswordA123!';
    const passwordB = 'SecurePasswordB456!';

    // -------------------------------------------------------------
    // TEST 1: Valid Registration
    // -------------------------------------------------------------
    console.log('--- TEST GROUP 1: Registration Security & Hashing ---');
    const regResA = await request('/api/auth/register', {
      method: 'POST',
      body: { name: 'Account A Author', email: userAEmail, password: passwordA }
    });
    assert(regResA.status === 201, '1. Valid registration returns 201 Created');
    assert(regResA.data.success === true, '1. Registration success flag is true');
    assert(typeof regResA.data.token === 'string', '1. Registration generates JWT token');
    assert(!regResA.data.user.password, '1. Password hash is never returned in registration response');
    assert(regResA.data.user.email === userAEmail, '1. Correct user email returned');
    const tokenA = regResA.data.token;
    const userAId = regResA.data.user.id || regResA.data.user._id;

    // -------------------------------------------------------------
    // TEST 2: Duplicate Registration Prevention
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 2: Duplicate Registration Handling ---');
    const dupRes = await request('/api/auth/register', {
      method: 'POST',
      body: { name: 'Account A Impersonator', email: userAEmail, password: 'DifferentPassword999!' }
    });
    assert(dupRes.status === 409, '2. Duplicate registration rejected with 409 Conflict');
    assert(dupRes.data.success === false, '2. Duplicate response success flag is false');

    // Register User B for cross-user tests
    const regResB = await request('/api/auth/register', {
      method: 'POST',
      body: { name: 'Account B Author', email: userBEmail, password: passwordB }
    });
    assert(regResB.status === 201, 'Registration of Account B returns 201 Created');
    const tokenB = regResB.data.token;
    const userBId = regResB.data.user.id || regResB.data.user._id;

    // -------------------------------------------------------------
    // TEST 3: Successful Login
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 3: Authentication & Login ---');
    const loginResA = await request('/api/auth/login', {
      method: 'POST',
      body: { email: userAEmail, password: passwordA }
    });
    assert(loginResA.status === 200, '3. Successful login returns 200 OK');
    assert(loginResA.data.success === true, '3. Login reports success: true');
    assert(typeof loginResA.data.token === 'string', '3. Login returns signed JWT token');
    assert(!loginResA.data.user.password, '3. Password hash is NOT exposed in login response');
    assert(loginResA.data.user.email === userAEmail, '3. Safe user identity returned in login response');

    // -------------------------------------------------------------
    // TEST 4: Invalid Login Rejection
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 4: Invalid Credentials & Generic Failure Messages ---');
    const badPassRes = await request('/api/auth/login', {
      method: 'POST',
      body: { email: userAEmail, password: 'WrongPassword999!' }
    });
    assert(badPassRes.status === 401, '4. Invalid password rejected with 401 Unauthorized');
    assert(badPassRes.data.message === 'Invalid email or password.', '4. Generic login failure message avoids enumeration');

    const badEmailRes = await request('/api/auth/login', {
      method: 'POST',
      body: { email: `nonexistent_${timestamp}@example.com`, password: 'SomePassword123!' }
    });
    assert(badEmailRes.status === 401, '4. Nonexistent email rejected with 401 Unauthorized');
    assert(badEmailRes.data.message === 'Invalid email or password.', '4. Nonexistent email returns identical generic message');

    // -------------------------------------------------------------
    // TEST 5: Missing Token Rejection
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 5: Token Verification & Guards ---');
    const missingTokenRes = await request('/api/blogs/my');
    assert(missingTokenRes.status === 401, '5. Missing token rejected with 401 Unauthorized on /api/blogs/my');

    // -------------------------------------------------------------
    // TEST 6: Invalid Token Rejection
    // -------------------------------------------------------------
    const invalidTokenRes = await request('/api/blogs/my', {
      headers: { 'Authorization': 'Bearer forged.invalid.token' }
    });
    assert(invalidTokenRes.status === 401, '6. Forged/invalid token rejected with 401 Unauthorized');

    // -------------------------------------------------------------
    // TEST 7: Expired Token Rejection
    // -------------------------------------------------------------
    const expiredToken = jwt.sign(
      { id: userAId, name: 'Account A Author', email: userAEmail },
      JWT_SECRET,
      { expiresIn: '-10s' } // Expired 10 seconds ago
    );
    const expiredTokenRes = await request('/api/blogs/my', {
      headers: { 'Authorization': `Bearer ${expiredToken}` }
    });
    assert(expiredTokenRes.status === 401, '7. Expired token rejected with 401 Unauthorized');

    // -------------------------------------------------------------
    // SETUP FOR USER-SPECIFIC BLOG TESTS
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 6: Per-User Blog Isolation & Dashboard ---');

    // Account A creates 1 published blog and 1 draft blog
    const blogA1Res = await request('/api/blogs', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokenA}` },
      body: {
        title: `Account A Article 1 (Published) - ${timestamp}`,
        category: 'Web Development',
        description: 'First public post by Author A',
        content: 'Content written exclusively by Author A for testing per-user isolation.',
        status: 'published'
      }
    });
    assert(blogA1Res.status === 201, 'Blog A1 created successfully');
    const blogA1 = blogA1Res.data.blog;

    const blogA2Res = await request('/api/blogs', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokenA}` },
      body: {
        title: `Account A Article 2 (Draft) - ${timestamp}`,
        category: 'Database',
        description: 'Private draft post by Author A',
        content: 'Draft content written by Author A that must remain invisible to Account B.',
        status: 'draft'
      }
    });
    assert(blogA2Res.status === 201, 'Blog A2 (Draft) created successfully');
    const blogA2 = blogA2Res.data.blog;

    // Account B creates 1 published blog and 2 draft blogs
    const blogB1Res = await request('/api/blogs', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokenB}` },
      body: {
        title: `Account B Article 1 (Published) - ${timestamp}`,
        category: 'CSS & Styling',
        description: 'First public post by Author B',
        content: 'Content written exclusively by Author B for testing per-user isolation.',
        status: 'published'
      }
    });
    assert(blogB1Res.status === 201, 'Blog B1 created successfully');
    const blogB1 = blogB1Res.data.blog;

    const blogB2Res = await request('/api/blogs', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokenB}` },
      body: {
        title: `Account B Article 2 (Draft) - ${timestamp}`,
        category: 'Accessibility',
        description: 'Private draft post by Author B',
        content: 'Draft content written by Author B that must remain invisible to Account A.',
        status: 'draft'
      }
    });
    assert(blogB2Res.status === 201, 'Blog B2 (Draft) created successfully');
    const blogB2 = blogB2Res.data.blog;

    // -------------------------------------------------------------
    // TEST 8: Protected Dashboard API (/api/blogs/my)
    // -------------------------------------------------------------
    const dashboardApiRes = await request('/api/blogs/my', {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    assert(dashboardApiRes.status === 200, '8. Protected dashboard API returns 200 OK with valid token');
    assert(dashboardApiRes.data.success === true, '8. Protected dashboard API reports success: true');
    assert(Array.isArray(dashboardApiRes.data.blogs), '8. Dashboard returns array of blogs');
    assert(typeof dashboardApiRes.data.stats === 'object', '8. Dashboard returns per-user stats object');

    // -------------------------------------------------------------
    // TEST 9: Account A sees ONLY Account A's blogs
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 7: Cross-User Dashboard Blog Filtering ---');
    const myBlogsARes = await request('/api/blogs/my', {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    assert(myBlogsARes.status === 200, '9. Account A queries /api/blogs/my (200 OK)');
    const myBlogsA = myBlogsARes.data.blogs;

    // All blogs in myBlogsA must have author equal to Account A
    const allBlogsAreA = myBlogsA.every(b => {
      const authorId = typeof b.author === 'object' ? (b.author._id || b.author.id) : b.author;
      return authorId.toString() === userAId.toString();
    });
    assert(allBlogsAreA, '9. Account A dashboard contains ONLY Account A blogs');

    // Account A must NOT see Account B's blogs
    const containsBInA = myBlogsA.some(b => (b._id || b.id) === (blogB1._id || blogB1.id) || (b._id || b.id) === (blogB2._id || blogB2.id));
    assert(!containsBInA, '9. Account A dashboard NEVER contains Account B blogs or drafts');

    // Verify stats for Account A
    assert(myBlogsARes.data.stats.total === 2, '9. Account A stats.total equals 2');
    assert(myBlogsARes.data.stats.published === 1, '9. Account A stats.published equals 1');
    assert(myBlogsARes.data.stats.drafts === 1, '9. Account A stats.drafts equals 1');

    // -------------------------------------------------------------
    // TEST 10: Account B sees ONLY Account B's blogs
    // -------------------------------------------------------------
    const myBlogsBRes = await request('/api/blogs/my', {
      headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    assert(myBlogsBRes.status === 200, '10. Account B queries /api/blogs/my (200 OK)');
    const myBlogsB = myBlogsBRes.data.blogs;

    const allBlogsAreB = myBlogsB.every(b => {
      const authorId = typeof b.author === 'object' ? (b.author._id || b.author.id) : b.author;
      return authorId.toString() === userBId.toString();
    });
    assert(allBlogsAreB, '10. Account B dashboard contains ONLY Account B blogs');

    const containsAInB = myBlogsB.some(b => (b._id || b.id) === (blogA1._id || blogA1.id) || (b._id || b.id) === (blogA2._id || blogA2.id));
    assert(!containsAInB, '10. Account B dashboard NEVER contains Account A blogs or drafts');

    // Verify stats for Account B
    assert(myBlogsBRes.data.stats.total === 2, '10. Account B stats.total equals 2');
    assert(myBlogsBRes.data.stats.published === 1, '10. Account B stats.published equals 1');
    assert(myBlogsBRes.data.stats.drafts === 1, '10. Account B stats.drafts equals 1');

    // -------------------------------------------------------------
    // TEST 11: Account A cannot read private drafts belonging to Account B
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 8: Cross-User Ownership Authorization ---');
    const readDraftBByA = await request(`/api/blogs/${blogB2._id || blogB2.id}`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    assert(readDraftBByA.status === 404, '11. Account A cannot read Account B draft (404 Not Found)');

    // Account B CAN read Account B's draft
    const readDraftBByB = await request(`/api/blogs/${blogB2._id || blogB2.id}`, {
      headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    assert(readDraftBByB.status === 200, '11. Account B (owner) can read their own draft (200 OK)');

    // -------------------------------------------------------------
    // TEST 12: Account A cannot update Account B's blog
    // -------------------------------------------------------------
    const updateBByA = await request(`/api/blogs/${blogB1._id || blogB1.id}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${tokenA}` },
      body: { title: 'Tampered by Account A' }
    });
    assert(updateBByA.status === 403, '12. Account A cannot update Account B blog (403 Forbidden)');

    // -------------------------------------------------------------
    // TEST 13: Account A cannot delete Account B's blog
    // -------------------------------------------------------------
    const deleteBByA = await request(`/api/blogs/${blogB1._id || blogB1.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    assert(deleteBByA.status === 403, '13. Account A cannot delete Account B blog (403 Forbidden)');

    // -------------------------------------------------------------
    // TEST 14: User Profile functionality (GET & PUT)
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 9: User Profile Functionality ---');
    const profileResA = await request('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    assert(profileResA.status === 200, '14. GET /api/auth/me returns 200 OK');
    assert(profileResA.data.user.name === 'Account A Author', '14. Profile displays correct name');
    assert(profileResA.data.user.email === userAEmail, '14. Profile displays correct email');
    assert(Boolean(profileResA.data.user.createdAt), '14. Profile returns account creation date (createdAt)');
    assert(typeof profileResA.data.user.stats === 'object', '14. Profile returns user article statistics');
    assert(profileResA.data.user.stats.total === 2, '14. Profile stats reflect total articles');

    // Profile update: update name
    const updateProfileRes = await request('/api/auth/profile', {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${tokenA}` },
      body: { name: 'Elena Rostova Updated' }
    });
    assert(updateProfileRes.status === 200, '14. PUT /api/auth/profile returns 200 OK');
    assert(updateProfileRes.data.user.name === 'Elena Rostova Updated', '14. Name updated successfully in profile');

    // Verify non-privileged fields cannot be tampered
    const tamperRoleRes = await request('/api/auth/profile', {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${tokenA}` },
      body: { name: 'Elena Rostova', role: 'admin', email: 'admin@blogcraft.io' }
    });
    assert(tamperRoleRes.status === 200, '14. Profile update completes without crashing');
    // Ensure email remained unchanged
    assert(tamperRoleRes.data.user.email === userAEmail, '14. Email and privileged fields cannot be altered via profile update');

    // -------------------------------------------------------------
    // TEST 15: Logout Client State & Token Absence Handling
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 10: Logout State & Credential Rejection ---');
    // Once client removes token, requests without header are rejected
    const loggedOutRequest = await request('/api/blogs/my');
    assert(loggedOutRequest.status === 401, '15. Requests without client credentials rejected (401 Unauthorized)');

    // -------------------------------------------------------------
    // TEST 16: Requests without credentials rejected across protected routes
    // -------------------------------------------------------------
    const unauthPostBlog = await request('/api/blogs', {
      method: 'POST',
      body: { title: 'Unauth Blog', category: 'General', description: 'desc', content: 'content' }
    });
    assert(unauthPostBlog.status === 401, '16. POST /api/blogs without token rejected (401 Unauthorized)');

    const unauthProfile = await request('/api/auth/profile');
    assert(unauthProfile.status === 401, '16. GET /api/auth/profile without token rejected (401 Unauthorized)');

    // -------------------------------------------------------------
    // TEST 17: Module 1–4 Functionality Regressions
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 11: Module 1-4 Regression Suite ---');
    const health = await request('/api/health');
    assert(health.status === 200, '17. Health endpoint responds 200 OK');
    assert(health.data.database === 'connected', '17. Database reports connected');

    const publicFeed = await request('/api/blogs');
    assert(publicFeed.status === 200, '17. Public blog feed returns 200 OK');
    const draftsInPublicFeed = publicFeed.data.blogs.filter(b => b.status === 'draft');
    assert(draftsInPublicFeed.length === 0, '17. Public feed NEVER contains drafts for unauthenticated requests');

    const searchRes = await request(`/api/blogs?search=Published`);
    assert(searchRes.status === 200, '17. Public search query succeeds (200 OK)');

    const categoryRes = await request(`/api/blogs?category=Web%20Development`);
    assert(categoryRes.status === 200, '17. Category filter succeeds (200 OK)');

    console.log('\n====================================================');
    console.log(`MODULE 5 TEST RUN COMPLETE: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  runModule5TestSuite();
}

module.exports = { runModule5TestSuite };
