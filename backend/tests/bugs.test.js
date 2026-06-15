const request = require('supertest');
const app     = require('../server');

// ---------------------------------------------------------------------------
// CORE TESTS — 7 tests that exercise all 6 bugs
// Fix all 6 bugs in server.js to make every test pass.
// ---------------------------------------------------------------------------

// ── Test 1: Health endpoint ──────────────────────────────────────────────────
// Requires Bug #5 and Bug #6 to be fixed so the app can be imported.
test('GET /health returns 200 and status healthy', async () => {
  const res = await request(app).get('/health');
  expect(res.statusCode).toBe(200);
  expect(res.body.status).toBe('healthy');
});

// ── Test 2: List bugs ────────────────────────────────────────────────────────
// Requires Bug #1 to be fixed so the database connection succeeds.
test('GET /api/bugs returns 200 and an array', async () => {
  const res = await request(app).get('/api/bugs');
  expect(res.statusCode).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
});

// ── Test 3: Create a bug ─────────────────────────────────────────────────────
test('POST /api/bugs with valid title returns 201 and the new bug', async () => {
  const res = await request(app)
    .post('/api/bugs')
    .send({ title: 'Test bug from automated suite' });
  expect(res.statusCode).toBe(201);
  expect(res.body.title).toBe('Test bug from automated suite');
  expect(res.body.status).toBe('open');
});

// ── Tests 4 & 5: Validation (Bug #2) ────────────────────────────────────────
test('POST /api/bugs with empty title returns 400', async () => {
  const res = await request(app)
    .post('/api/bugs')
    .send({ title: '' });
  expect(res.statusCode).toBe(400);
});

test('POST /api/bugs with whitespace-only title returns 400', async () => {
  const res = await request(app)
    .post('/api/bugs')
    .send({ title: '   ' });
  expect(res.statusCode).toBe(400);
});

// ── Test 6: Delete a bug (Bug #3) ────────────────────────────────────────────
test('DELETE /api/bugs/:id removes the bug and returns 200', async () => {
  // Create a bug first, then delete it
  const created = await request(app)
    .post('/api/bugs')
    .send({ title: 'Bug to be deleted' });
  expect(created.statusCode).toBe(201);

  const id = created.body.id;
  const del = await request(app).delete(`/api/bugs/${id}`);
  expect(del.statusCode).toBe(200);

  // Confirm it is gone
  const list = await request(app).get('/api/bugs');
  const ids = list.body.map(b => b.id);
  expect(ids).not.toContain(id);
});

// ── Test 7: Update a bug (Bug #4) ────────────────────────────────────────────
test('PUT /api/bugs/:id updates title and status, returns 200', async () => {
  const created = await request(app)
    .post('/api/bugs')
    .send({ title: 'Bug to be updated' });
  expect(created.statusCode).toBe(201);

  const id = created.body.id;
  const updated = await request(app)
    .put(`/api/bugs/${id}`)
    .send({ title: 'Updated bug title', status: 'in_progress' });
  expect(updated.statusCode).toBe(200);
  expect(updated.body.title).toBe('Updated bug title');
  expect(updated.body.status).toBe('in_progress');
});

// ---------------------------------------------------------------------------
// OPTIONAL CHALLENGE TESTS
// Uncomment each block when you are ready to implement that feature.
// ---------------------------------------------------------------------------

// CHALLENGE 1: Search by title
// GET /api/bugs?search=<query> filters results to bugs whose title contains
// the query string (case-insensitive). Implement using SQL ILIKE.
//
// test('GET /api/bugs?search= filters by title', async () => {
//   await request(app).post('/api/bugs').send({ title: 'Unique search term XYZ' });
//   const res = await request(app).get('/api/bugs?search=XYZ');
//   expect(res.statusCode).toBe(200);
//   expect(res.body.length).toBeGreaterThan(0);
//   expect(res.body.every(b => b.title.toLowerCase().includes('xyz'))).toBe(true);
// });

// CHALLENGE 2: Severity field
// POST and PUT should accept an optional { severity } field.
// severity must be one of: 'low', 'medium', 'high', 'critical'
//
// test('POST /api/bugs accepts severity field', async () => {
//   const res = await request(app)
//     .post('/api/bugs')
//     .send({ title: 'Critical bug', severity: 'critical' });
//   expect(res.statusCode).toBe(201);
//   expect(res.body.severity).toBe('critical');
// });
