const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// BUG #1: Wrong default password — does not match docker-compose.yml!
// STUDENT FIX: Change 'wrongpassword' to 'bugpassword' (or use env var properly)
const pool = new Pool({
  user:     process.env.DB_USER     || 'postgres',
  host:     process.env.DB_HOST     || 'localhost',
  database: process.env.DB_NAME     || 'bugdb',
  password: process.env.DB_PASSWORD || 'wrongpassword',
  port:     parseInt(process.env.DB_PORT) || 5432,
});

// ── Health ──────────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', version: '1.0.0' });
});

// ── GET /api/bugs ────────────────────────────────────────────────────────────
// Returns all bugs, newest first.
// OPTIONAL CHALLENGE: support ?search=<query> to filter by title.
//   Example: GET /api/bugs?search=docker  → bugs whose title contains "docker" (case-insensitive)
//   Hint: Use a SQL WHERE clause with ILIKE.
// OPTIONAL CHALLENGE: support ?status=open to filter by status.
app.get('/api/bugs', async (req, res) => {
  try {
    // STUDENT TODO (optional): read req.query.search / req.query.status
    // and add WHERE clauses when they are provided
    const result = await pool.query('SELECT * FROM bugs ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/bugs ───────────────────────────────────────────────────────────
// BUG #2: No validation — empty / whitespace-only titles are accepted.
// STUDENT FIX: Check that title is a non-empty, non-whitespace string.
//   Return HTTP 400 with { error: "Title is required" } when invalid.
app.post('/api/bugs', async (req, res) => {
  try {
    const { title, status = 'open' } = req.body;

    // STUDENT FIX: Add validation here
    // if (!title || !title.trim()) {
    //   return res.status(400).json({ error: 'Title is required' });
    // }

    const result = await pool.query(
      'INSERT INTO bugs (title, status) VALUES ($1, $2) RETURNING *',
      [title, status]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// BUG #3: DELETE endpoint is missing — but tests expect it!
// STUDENT TODO: Implement DELETE /api/bugs/:id
//   - Query: DELETE FROM bugs WHERE id = $1 RETURNING *
//   - Return 200 with the deleted row, or 404 if not found.

// BUG #4: PUT endpoint is missing — but tests expect it!
// STUDENT TODO: Implement PUT /api/bugs/:id
//   - Accept { title, status } in the request body
//   - Query: UPDATE bugs SET title=$1, status=$2 WHERE id=$3 RETURNING *
//   - Return 200 with the updated row, or 404 if not found.
//   - Valid status values: 'open', 'in_progress', 'closed'
//
// OPTIONAL CHALLENGE: also accept a { severity } field in the body
//   and store it in the database.  severity must be one of:
//   'low', 'medium', 'high', 'critical'

// ── Server startup ───────────────────────────────────────────────────────────
// BUG #5: Server starts unconditionally — this causes a port conflict when Jest
//   imports this file, because supertest also binds a port.
// STUDENT FIX: Wrap the listen() call so it only runs when this file is the
//   entry-point, not when it is require()-d by a test.
//   Hint: if (require.main === module) { app.listen(...) }
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Bug Tracker backend running on port ${port}`);
});

// BUG #6: App is not exported — tests cannot import it!
// STUDENT FIX: Add the line below (remove the comment characters):
// module.exports = app;
