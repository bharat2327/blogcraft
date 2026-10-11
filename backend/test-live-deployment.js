/**
 * BlogCraft Live Production Smoke Test Suite
 * Tests the live deployed service at https://blogcraft-40lj.onrender.com
 */

const BASE_URL = process.env.LIVE_URL || 'https://blogcraft-40lj.onrender.com';

async function runLiveSmokeTests() {
  console.log(`====================================================`);
  console.log(`🌐 RUNNING LIVE PRODUCTION SMOKE TESTS`);
  console.log(`📡 Target: ${BASE_URL}`);
  console.log(`====================================================\n`);

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Health Endpoint
    console.log(`--- 1. Health & Database Connectivity ---`);
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200, `GET /api/health returned 200 OK`);
    assert(healthData.success === true, `Health check reports success: true`);
    assert(healthData.database === 'connected', `MongoDB reports "connected" status`);

    // 2. Public Homepage & Static Assets
    console.log(`\n--- 2. Public Frontend Assets ---`);
    const homeRes = await fetch(`${BASE_URL}/`);
    assert(homeRes.status === 200, `Homepage GET / returns 200 OK`);
    assert(homeRes.headers.get('content-type').includes('text/html'), `Homepage content-type is text/html`);

    const cssRes = await fetch(`${BASE_URL}/css/style.css`);
    assert(cssRes.status === 200, `Static asset GET /css/style.css returns 200 OK`);

    const jsRes = await fetch(`${BASE_URL}/js/main.js`);
    assert(jsRes.status === 200, `Static asset GET /js/main.js returns 200 OK`);

    // 3. Public Blog Feed & Search/Filter
    console.log(`\n--- 3. Public Blog Feed & Query Filters ---`);
    const feedRes = await fetch(`${BASE_URL}/api/blogs`);
    const feedData = await feedRes.json();
    assert(feedRes.status === 200, `GET /api/blogs returns 200 OK`);
    assert(Array.isArray(feedData.blogs), `Blog feed returns array of blogs`);
    assert(feedData.blogs.length > 0, `Blog feed contains seeded published blogs`);

    // Filter by Category
    const catRes = await fetch(`${BASE_URL}/api/blogs?category=JavaScript`);
    const catData = await catRes.json();
    assert(catRes.status === 200, `GET /api/blogs?category=JavaScript returns 200 OK`);
    assert(catData.blogs.every(b => b.category === 'JavaScript'), `All filtered blogs match category "JavaScript"`);

    // Search by Title
    const searchRes = await fetch(`${BASE_URL}/api/blogs?search=CSS`);
    const searchData = await searchRes.json();
    assert(searchRes.status === 200, `GET /api/blogs?search=CSS returns 200 OK`);
    assert(searchData.blogs.some(b => b.title.includes('CSS')), `Search results contain matching title`);

    // 4. User Registration & Security
    console.log(`\n--- 4. Authentication: Registration & Login ---`);
    const testEmail = `test_author_${Date.now()}@example.com`;
    const testPassword = 'Password123!';
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Smoke Test Author',
        email: testEmail,
        password: testPassword
      })
    });
    const regData = await regRes.json();
    assert(regRes.status === 201, `POST /api/auth/register returns 201 Created`);
    assert(regData.success === true, `Registration reports success: true`);
    assert(!!regData.token, `Registration returns signed JWT token`);
    assert(!regData.user.password, `Password hash is NOT exposed in response`);

    // Duplicate Registration Rejection
    const dupRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Duplicate Author',
        email: testEmail,
        password: testPassword
      })
    });
    assert(dupRes.status === 409, `Duplicate email registration rejected with 409 Conflict`);

    // Invalid Login Rejection
    const badLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'WrongPassword999!'
      })
    });
    assert(badLoginRes.status === 401, `Invalid password rejected with 401 Unauthorized`);

    // Valid Login
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200, `POST /api/auth/login returns 200 OK`);
    assert(loginData.success === true, `Login reports success: true`);
    const authToken = loginData.token;
    assert(!!authToken, `Login issues valid JWT token`);

    // 5. Protected Profile & Dashboard Isolation
    console.log(`\n--- 5. Protected Endpoints & Author Dashboard ---`);
    const profileRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const profileData = await profileRes.json();
    assert(profileRes.status === 200, `GET /api/auth/me returns 200 OK`);
    assert(profileData.user.email === testEmail, `Profile matches authenticated user email`);

    const dashRes = await fetch(`${BASE_URL}/api/blogs/my`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const dashData = await dashRes.json();
    assert(dashRes.status === 200, `GET /api/blogs/my returns 200 OK`);
    assert(dashData.blogs.length === 0, `Initial author dashboard isolated (0 articles)`);

    // 6. Blog CRUD Operations
    console.log(`\n--- 6. Author Blog CRUD Lifecycle ---`);
    const createRes = await fetch(`${BASE_URL}/api/blogs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        title: 'Live Production Test Article',
        category: 'Web Development',
        description: 'Verifying end-to-end CRUD operations on live Render deployment.',
        content: 'This blog post was programmatically created during live smoke testing to confirm database persistence.',
        status: 'published',
        featured: false
      })
    });
    const createData = await createRes.json();
    assert(createRes.status === 201, `POST /api/blogs returns 201 Created`);
    assert(createData.success === true, `Blog creation reports success: true`);
    const blogId = createData.blog._id || createData.blog.id;
    assert(!!blogId, `Created blog has valid MongoDB ObjectId: ${blogId}`);

    // Read Individual Blog
    const getBlogRes = await fetch(`${BASE_URL}/api/blogs/${blogId}`);
    const getBlogData = await getBlogRes.json();
    assert(getBlogRes.status === 200, `GET /api/blogs/:id returns 200 OK`);
    assert(getBlogData.blog.title === 'Live Production Test Article', `Retrieved blog matches created title`);

    // Update Blog
    const updateRes = await fetch(`${BASE_URL}/api/blogs/${blogId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        title: 'Updated Live Production Test Article',
        category: 'Web Development',
        description: 'Updated description for smoke test.',
        content: 'Updated content confirming write capability.',
        status: 'published'
      })
    });
    const updateData = await updateRes.json();
    assert(updateRes.status === 200, `PUT /api/blogs/:id returns 200 OK`);
    assert(updateData.blog.title === 'Updated Live Production Test Article', `Updated blog title verified`);

    // Author Dashboard now shows 1 blog
    const postCreateDash = await fetch(`${BASE_URL}/api/blogs/my`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const postDashData = await postCreateDash.json();
    assert(postDashData.blogs.length === 1, `Author dashboard now reflects 1 created article`);
    assert(postDashData.stats.total === 1, `Author stats total equals 1`);

    // Delete Blog
    const delRes = await fetch(`${BASE_URL}/api/blogs/${blogId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    assert(delRes.status === 200, `DELETE /api/blogs/:id returns 200 OK`);

    // Verify 404 After Delete
    const verifyDelRes = await fetch(`${BASE_URL}/api/blogs/${blogId}`);
    assert(verifyDelRes.status === 404, `GET /api/blogs/:id after deletion returns 404 Not Found`);

    console.log(`\n====================================================`);
    console.log(`🎯 LIVE SMOKE TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log(`====================================================`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('💥 Smoke test suite execution error:', err);
    process.exit(1);
  }
}

runLiveSmokeTests();
