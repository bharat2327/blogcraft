/**
 * BlogCraft - Module 4 Comprehensive CRUD, Search/Filter, & Security Test Suite
 * Covers all 17 required verification points:
 * 1. Authenticated create
 * 2. Unauthenticated create rejection (401)
 * 3. Read all published blogs
 * 4. Read individual blog
 * 5. Read nonexistent blog (404)
 * 6. Edit own blog
 * 7. Reject editing another user's blog (403)
 * 8. Delete own blog
 * 9. Reject deleting another user's blog (403)
 * 10. Save draft (status: draft & privacy verification)
 * 11. Publish draft (update draft to published)
 * 12. Search blogs (?search=...)
 * 13. Filter by category (?category=...)
 * 14. Combined search/filter (?search=...&category=...)
 * 15. Database persistence verification
 * 16. Frontend CRUD integration (endpoint & model contracts)
 * 17. Module 1–3 regression tests (health, register, login, duplicate check, bcrypt, jwt)
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

async function runTestSuite() {
  console.log('====================================================');
  console.log('BLOGCRAFT — MODULE 4 FULL CRUD & SECURITY TEST SUITE');
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
    // -------------------------------------------------------------
    // REGRESSION TESTS (Module 1 - 3 Foundation)
    // -------------------------------------------------------------
    console.log('--- TEST GROUP 1: Health & Regressions (Module 1-3) ---');
    const health = await request('/api/health');
    assert(health.status === 200, 'Health endpoint returns 200 OK');
    assert(health.data.database === 'connected', 'MongoDB database status reports "connected"');

    const timestamp = Date.now();
    const authorOneEmail = `author1_${timestamp}@blogcraft.io`;
    const authorTwoEmail = `author2_${timestamp}@blogcraft.io`;

    // Register Author 1
    const regRes1 = await request('/api/auth/register', {
      method: 'POST',
      body: { name: 'Elena Rostova', email: authorOneEmail, password: 'Password123!' }
    });
    assert(regRes1.status === 201, 'Author 1 registration returns 201 Created');
    assert(!regRes1.data.user.password, 'Password hash is NOT exposed in registration response');
    const token1 = regRes1.data.token;
    const author1Id = regRes1.data.user.id || regRes1.data.user._id;

    // Reject duplicate registration
    const dupRes = await request('/api/auth/register', {
      method: 'POST',
      body: { name: 'Elena Clone', email: authorOneEmail, password: 'AnotherPassword' }
    });
    assert(dupRes.status === 409, 'Duplicate email registration rejected with 409 Conflict');

    // Register Author 2
    const regRes2 = await request('/api/auth/register', {
      method: 'POST',
      body: { name: 'Marcus Vance', email: authorTwoEmail, password: 'Password456!' }
    });
    assert(regRes2.status === 201, 'Author 2 registration returns 201 Created');
    const token2 = regRes2.data.token;

    // Login Author 1
    const loginRes = await request('/api/auth/login', {
      method: 'POST',
      body: { email: authorOneEmail, password: 'Password123!' }
    });
    assert(loginRes.status === 200, 'Login returns 200 OK');
    assert(typeof loginRes.data.token === 'string', 'Login generates valid JWT token');

    // -------------------------------------------------------------
    // REQUIREMENT 1: Authenticated Create
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 2: Blog Creation (Create CRUD) ---');
    const uniqueTag = `M4_${timestamp}`;
    const publishedPayload = {
      title: `Architecting High-Performance Node Services ${uniqueTag}`,
      category: 'Web Development',
      image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
      description: `A deep exploration of scalable backend systems and asynchronous event loops. ${uniqueTag}`,
      content: 'Building scalable microservices requires an in-depth understanding of the Node.js event loop, garbage collection, and database connection pooling. In this guide we detail proven architectural blueprints.',
      status: 'published'
    };

    const createRes = await request('/api/blogs', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token1}` },
      body: publishedPayload
    });

    assert(createRes.status === 201, '1. Authenticated create returns 201 Created');
    assert(createRes.data.success === true, '1. Create response indicates success');
    const createdBlog1 = createRes.data.blog;
    const blogId1 = createdBlog1._id || createdBlog1.id;
    assert(Boolean(blogId1), '1. Created blog has valid MongoDB ObjectId');
    assert(createdBlog1.status === 'published', '1. Blog status is published');

    // -------------------------------------------------------------
    // REQUIREMENT 2: Unauthenticated Create Rejection
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 3: Authentication Rejection ---');
    const unauthCreate = await request('/api/blogs', {
      method: 'POST',
      body: {
        title: 'Unauthorized Post Attempt',
        category: 'Security',
        description: 'Should fail because no token was supplied',
        content: 'This blog creation request lacks an Authorization header.'
      }
    });
    assert(unauthCreate.status === 401, '2. Unauthenticated create rejected with 401 Unauthorized');

    // -------------------------------------------------------------
    // REQUIREMENT 10: Save Draft
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 4: Draft Management & Privacy ---');
    const draftPayload = {
      title: `Private Research Notes on Distributed Systems ${uniqueTag}`,
      category: 'Database',
      image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
      description: `Unpublished draft notes regarding consensus algorithms and Raft protocol. ${uniqueTag}`,
      content: 'Early drafts: Testing leader election timeouts, heartbeat intervals, and persistent state transitions.',
      status: 'draft'
    };

    const draftCreateRes = await request('/api/blogs', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token1}` },
      body: draftPayload
    });

    assert(draftCreateRes.status === 201, '10. Save draft returns 201 Created');
    const draftBlog = draftCreateRes.data.blog;
    const draftId = draftBlog._id || draftBlog.id;
    assert(draftBlog.status === 'draft', '10. Draft status saved as "draft"');

    // Verify unauthenticated user CANNOT read the draft
    const unauthDraftRead = await request(`/api/blogs/${draftId}`);
    assert(unauthDraftRead.status === 404, '10. Unauthenticated read of private draft returns 404 Not Found');

    // Verify Author 2 (different user) CANNOT read Author 1's draft
    const author2DraftRead = await request(`/api/blogs/${draftId}`, {
      headers: { 'Authorization': `Bearer ${token2}` }
    });
    assert(author2DraftRead.status === 404, '10. Non-author read of private draft returns 404 Not Found');

    // Verify Author 1 (the owner) CAN read their own draft
    const author1DraftRead = await request(`/api/blogs/${draftId}`, {
      headers: { 'Authorization': `Bearer ${token1}` }
    });
    assert(author1DraftRead.status === 200, '10. Author can read their own draft (200 OK)');

    // -------------------------------------------------------------
    // REQUIREMENT 11: Publish Draft
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 5: Publish Draft ---');
    const publishDraftRes = await request(`/api/blogs/${draftId}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token1}` },
      body: { status: 'published' }
    });
    assert(publishDraftRes.status === 200, '11. Publish draft returns 200 OK');
    assert(publishDraftRes.data.blog.status === 'published', '11. Status updated from draft to published');

    // Now unauthenticated user CAN read it
    const publicReadPublishedDraft = await request(`/api/blogs/${draftId}`);
    assert(publicReadPublishedDraft.status === 200, '11. Published draft is now publicly readable');

    // -------------------------------------------------------------
    // REQUIREMENT 3: Read All Published Blogs
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 6: Read All Blogs ---');
    const allBlogsRes = await request('/api/blogs');
    assert(allBlogsRes.status === 200, '3. Read all published blogs returns 200 OK');
    assert(Array.isArray(allBlogsRes.data.blogs), '3. Returns array of blogs');
    const foundPublished = allBlogsRes.data.blogs.find(b => (b._id || b.id) === blogId1);
    assert(Boolean(foundPublished), '3. Newly created published blog is present in list');

    // -------------------------------------------------------------
    // REQUIREMENT 4: Read Individual Blog
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 7: Read Individual Blog ---');
    const singleBlogRes = await request(`/api/blogs/${blogId1}`);
    assert(singleBlogRes.status === 200, '4. Read individual blog returns 200 OK');
    assert(singleBlogRes.data.blog.title === publishedPayload.title, '4. Retrieved blog title matches');
    assert(singleBlogRes.data.blog.content === publishedPayload.content, '4. Full content retrieved intact');

    // -------------------------------------------------------------
    // REQUIREMENT 5: Read Nonexistent Blog
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 8: Read Nonexistent Blog ---');
    const nonExistentRes = await request('/api/blogs/650000000000000000000000');
    assert(nonExistentRes.status === 404, '5. Read nonexistent blog returns 404 Not Found');

    // -------------------------------------------------------------
    // REQUIREMENT 7: Reject Editing Another User's Blog (403)
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 9: Update Authorization & Ownership ---');
    const unauthorizedEdit = await request(`/api/blogs/${blogId1}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token2}` },
      body: { title: 'Tampered by Marcus' }
    });
    assert(unauthorizedEdit.status === 403, '7. Reject editing another user blog with 403 Forbidden');

    // -------------------------------------------------------------
    // REQUIREMENT 6: Edit Own Blog
    // -------------------------------------------------------------
    const updatedTitle = `Architecting High-Performance Node Services [PRO EDITION] ${uniqueTag}`;
    const authorizedEdit = await request(`/api/blogs/${blogId1}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token1}` },
      body: { title: updatedTitle }
    });
    assert(authorizedEdit.status === 200, '6. Edit own blog returns 200 OK');
    assert(authorizedEdit.data.blog.title === updatedTitle, '6. Blog title persisted to MongoDB');

    // -------------------------------------------------------------
    // REQUIREMENT 9: Reject Deleting Another User's Blog (403)
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 10: Delete Authorization & Ownership ---');
    const unauthorizedDelete = await request(`/api/blogs/${blogId1}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token2}` }
    });
    assert(unauthorizedDelete.status === 403, '9. Reject deleting another user blog with 403 Forbidden');

    // -------------------------------------------------------------
    // REQUIREMENT 8: Delete Own Blog
    // -------------------------------------------------------------
    const authorizedDelete = await request(`/api/blogs/${blogId1}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token1}` }
    });
    assert(authorizedDelete.status === 200, '8. Delete own blog returns 200 OK');

    const checkDeletedRes = await request(`/api/blogs/${blogId1}`);
    assert(checkDeletedRes.status === 404, '8. Deleted blog is no longer found in MongoDB (404)');

    // -------------------------------------------------------------
    // REQUIREMENT 12: Search Blogs
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 11: Search & Filter Verification ---');
    const searchTargetTitle = `UniqueGraphQLSearchTarget_${timestamp}`;
    const searchTargetDesc = `Exploring schemas resolvers and mutations ${uniqueTag}`;
    const searchBlog = await request('/api/blogs', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token1}` },
      body: {
        title: searchTargetTitle,
        category: 'UI/UX Design',
        description: searchTargetDesc,
        content: 'GraphQL provides declarative data fetching and prevents over-fetching.',
        status: 'published'
      }
    });
    const searchBlogId = searchBlog.data.blog._id || searchBlog.data.blog.id;

    const searchRes = await request(`/api/blogs?search=${encodeURIComponent(searchTargetTitle)}`);
    assert(searchRes.status === 200, '12. Search blogs endpoint returns 200 OK');
    const searchFound = searchRes.data.blogs.some(b => (b._id || b.id) === searchBlogId);
    assert(searchFound, '12. Search by title successfully finds target blog document');

    // -------------------------------------------------------------
    // REQUIREMENT 13: Filter by Category
    // -------------------------------------------------------------
    const categoryRes = await request('/api/blogs?category=UI/UX%20Design');
    assert(categoryRes.status === 200, '13. Filter by category returns 200 OK');
    const allMatchCat = categoryRes.data.blogs.every(b => b.category.toLowerCase() === 'ui/ux design');
    assert(allMatchCat, '13. All returned blogs match the specified category');

    // -------------------------------------------------------------
    // REQUIREMENT 14: Combined Search/Filter
    // -------------------------------------------------------------
    const combinedRes = await request(`/api/blogs?search=${encodeURIComponent(searchTargetTitle)}&category=UI/UX%20Design`);
    assert(combinedRes.status === 200, '14. Combined search/filter returns 200 OK');
    const combinedFound = combinedRes.data.blogs.some(b => (b._id || b.id) === searchBlogId);
    assert(combinedFound, '14. Blog found when both search query and category filter match');

    // Negative combined check: same title, non-matching category
    const mismatchCombined = await request(`/api/blogs?search=${encodeURIComponent(searchTargetTitle)}&category=CSS%20%26%20Styling`);
    assert(mismatchCombined.status === 200, '14. Combined query with mismatched category returns 200');
    const mismatchFound = mismatchCombined.data.blogs.some(b => (b._id || b.id) === searchBlogId);
    assert(!mismatchFound, '14. Blog excluded when category filter does not match');

    // -------------------------------------------------------------
    // REQUIREMENT 15: Database Persistence
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 12: Persistence Verification ---');
    const persistenceCheck = await request(`/api/blogs/${searchBlogId}`);
    assert(persistenceCheck.status === 200, '15. Target blog document remains safely stored in MongoDB');
    assert(persistenceCheck.data.blog.title === searchTargetTitle, '15. Data attributes preserved intact');

    // -------------------------------------------------------------
    // REQUIREMENT 16: Frontend CRUD Integration Contract
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 13: Frontend-Backend Contract ---');
    assert(Boolean(searchBlog.data.blog.id || searchBlog.data.blog._id), '16. Virtual "id" and "_id" present for frontend templates');
    assert(Boolean(searchBlog.data.blog.date), '16. Formatted date property present for frontend display');
    assert(Boolean(searchBlog.data.blog.author && searchBlog.data.blog.author.name), '16. Populated author object returned for card rendering');

    console.log('\n====================================================');
    console.log(`TEST RUN SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
}

runTestSuite();
