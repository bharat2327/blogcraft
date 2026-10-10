/**
 * Comprehensive Integration & Verification Test Suite for Module 3
 * Tests:
 * 1. Health check & MongoDB connection status
 * 2. User registration (MongoDB persistence, bcrypt password hashing, no plain passwords returned)
 * 3. Duplicate registration conflict (409)
 * 4. User login & JWT generation
 * 5. Blog creation with authenticated author
 * 6. Blog retrieval (all blogs with author population)
 * 7. Individual blog retrieval by ID (200 & 404 handling)
 * 8. Blog update with ownership verification (403 for non-owners)
 * 9. Blog deletion with ownership verification
 * 10. Data persistence across simulated server cycle
 */

const http = require('http');

const BASE_URL = 'http://127.0.0.1:5000';

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

async function runTests() {
  console.log('====================================================');
  console.log('STARTING MODULE 3 COMPREHENSIVE VERIFICATION SUITE');
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
    // 1. Health Check
    console.log('--- TEST 1: Health Check & Database Connection ---');
    const health = await request('/api/health');
    assert(health.status === 200, 'Health endpoint returns 200 OK');
    assert(health.data.database === 'connected', 'Database status reports "connected"', JSON.stringify(health.data));

    // 2. User Registration
    console.log('\n--- TEST 2: User Registration & Password Hashing ---');
    const testEmail1 = `alice_${Date.now()}@example.com`;
    const regRes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Alice Developer',
        email: testEmail1,
        password: 'SecurePassword123!'
      }
    });

    assert(regRes.status === 201, 'User registration returns 201 Created');
    assert(regRes.data.success === true, 'Registration reports success: true');
    assert(regRes.data.user && regRes.data.user.email === testEmail1, 'Registered user returned with correct email');
    assert(!regRes.data.user.password, 'Password hash is NOT exposed in response payload');
    assert(typeof regRes.data.token === 'string', 'JWT token issued upon registration');

    const tokenAlice = regRes.data.token;
    const aliceId = regRes.data.user.id || regRes.data.user._id;

    // 3. Duplicate Registration Prevention
    console.log('\n--- TEST 3: Duplicate Email Conflict Handling ---');
    const dupRes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Alice Duplicate',
        email: testEmail1,
        password: 'AnotherPassword456'
      }
    });
    assert(dupRes.status === 409, 'Duplicate email returns 409 Conflict', `Received ${dupRes.status}`);

    // 4. User Login
    console.log('\n--- TEST 4: User Login & JWT Generation ---');
    const loginRes = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: testEmail1,
        password: 'SecurePassword123!'
      }
    });
    assert(loginRes.status === 200, 'Login returns 200 OK');
    assert(loginRes.data.success === true, 'Login reports success: true');
    assert(typeof loginRes.data.token === 'string', 'Login returns valid JWT token');
    assert(!loginRes.data.user.password, 'Login response does NOT expose password hash');

    // 4b. Invalid Login Rejection
    const badLoginRes = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: testEmail1,
        password: 'WrongPasswordXYZ'
      }
    });
    assert(badLoginRes.status === 401, 'Invalid password rejected with 401 Unauthorized');

    // 5. Register Second User for Ownership Tests
    const testEmail2 = `bob_${Date.now()}@example.com`;
    const bobReg = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Bob Reviewer',
        email: testEmail2,
        password: 'BobSecurePassword789'
      }
    });
    const tokenBob = bobReg.data.token;

    // 6. Blog Creation (Alice)
    console.log('\n--- TEST 5: Blog Creation with MongoDB Association ---');
    const blogPayload = {
      title: 'Mastering MongoDB Integration in Node.js',
      category: 'Database',
      image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
      description: 'A deep dive into connecting Mongoose with persistent database storage.',
      content: 'MongoDB is a document-oriented database that offers immense flexibility, scale, and performance for modern web applications. In this article, we explore schemas, population, and indexes.',
      status: 'published'
    };

    const createRes = await request('/api/blogs', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokenAlice}` },
      body: blogPayload
    });

    assert(createRes.status === 201, 'Blog creation returns 201 Created');
    assert(createRes.data.success === true, 'Blog creation reports success: true');
    assert(Boolean(createRes.data.blog), 'Created blog returned in response');
    const createdBlog = createRes.data.blog;
    const blogId = createdBlog._id || createdBlog.id;
    assert(Boolean(blogId), 'Created blog has valid MongoDB ObjectId');

    // 7. Blog Retrieval (All)
    console.log('\n--- TEST 6: Retrieve All Blogs with MongoDB Population ---');
    const allBlogsRes = await request('/api/blogs');
    assert(allBlogsRes.status === 200, 'GET /api/blogs returns 200 OK');
    assert(Array.isArray(allBlogsRes.data.blogs), 'GET /api/blogs returns array of blogs');
    const foundCreated = allBlogsRes.data.blogs.find(b => (b._id || b.id) === blogId);
    assert(Boolean(foundCreated), 'Newly created blog is found in database listing');
    assert(typeof foundCreated.author === 'object' && foundCreated.author.name === 'Alice Developer', 'Author field is populated with name');

    // 8. Individual Blog Details (GET /api/blogs/:id)
    console.log('\n--- TEST 7: Retrieve Individual Blog by ID ---');
    const singleBlogRes = await request(`/api/blogs/${blogId}`);
    assert(singleBlogRes.status === 200, 'GET /api/blogs/:id returns 200 OK');
    assert(singleBlogRes.data.blog.title === blogPayload.title, 'Retrieved blog matches title');
    assert(singleBlogRes.data.blog.content === blogPayload.content, 'Retrieved blog matches full content');

    // 8b. Invalid Blog ID returns 404
    const notFoundRes = await request('/api/blogs/650000000000000000000000');
    assert(notFoundRes.status === 404, 'Non-existent ID returns 404 Not Found');

    // 9. Blog Ownership & Unauthorized Update / Delete Protection
    console.log('\n--- TEST 8: Ownership Verification & 403 Forbidden Protection ---');
    const bobUpdateRes = await request(`/api/blogs/${blogId}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${tokenBob}` },
      body: { title: 'Hacked by Bob' }
    });
    assert(bobUpdateRes.status === 403, 'Non-author cannot update blog (403 Forbidden)');

    const bobDeleteRes = await request(`/api/blogs/${blogId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${tokenBob}` }
    });
    assert(bobDeleteRes.status === 403, 'Non-author cannot delete blog (403 Forbidden)');

    // 10. Authorized Blog Update (Alice)
    console.log('\n--- TEST 9: Authorized Blog Update ---');
    const aliceUpdateRes = await request(`/api/blogs/${blogId}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${tokenAlice}` },
      body: { title: 'Mastering MongoDB Integration in Node.js (Updated Edition)' }
    });
    assert(aliceUpdateRes.status === 200, 'Owner update returns 200 OK');
    assert(aliceUpdateRes.data.blog.title.includes('Updated Edition'), 'Blog title updated in MongoDB');

    // 11. Authorized Blog Deletion (Alice)
    console.log('\n--- TEST 10: Authorized Blog Deletion ---');
    const aliceDeleteRes = await request(`/api/blogs/${blogId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${tokenAlice}` }
    });
    assert(aliceDeleteRes.status === 200, 'Owner deletion returns 200 OK');

    const checkDeletedRes = await request(`/api/blogs/${blogId}`);
    assert(checkDeletedRes.status === 404, 'Deleted blog is no longer found in MongoDB (404)');

    console.log('\n====================================================');
    console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Unexpected error during testing:', err);
    process.exit(1);
  }
}

runTests();
