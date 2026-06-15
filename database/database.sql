-- Database initialization script
-- This file runs automatically when the postgres container starts for the first time.
-- If you modify it after the container has already started, run:
--   docker-compose down -v && docker-compose up -d

CREATE TABLE IF NOT EXISTS bugs (
  id         SERIAL PRIMARY KEY,
  title      VARCHAR(255) NOT NULL,
  status     VARCHAR(20)  NOT NULL DEFAULT 'open'
             CHECK (status IN ('open', 'in_progress', 'closed')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── OPTIONAL CHALLENGE ──────────────────────────────────────────────────────
-- Add a severity column to categorise bugs by impact.
-- Uncomment the block below and rebuild your containers when you are ready.
--
-- ALTER TABLE bugs
--   ADD COLUMN IF NOT EXISTS severity VARCHAR(20)
--   NOT NULL DEFAULT 'medium'
--   CHECK (severity IN ('low', 'medium', 'high', 'critical'));
--
-- When you add this column you also need to:
--   1. Update POST /api/bugs to accept and store a severity value.
--   2. Update PUT  /api/bugs/:id to accept and update the severity value.
--   3. Update the frontend to display severity and allow filtering by it.
-- ────────────────────────────────────────────────────────────────────────────

-- Seed data — these are the actual bugs students must fix during the project
INSERT INTO bugs (title, status) VALUES
  ('Wrong database password causes connection failure',  'open'),
  ('POST /api/bugs allows empty title',                  'open'),
  ('DELETE /api/bugs/:id endpoint not implemented',      'open'),
  ('PUT /api/bugs/:id endpoint not implemented',         'open'),
  ('Server starts unconditionally during test run',      'open'),
  ('App module not exported — tests cannot import it',   'open'),
  ('Frontend: Delete button not implemented',            'open'),
  ('Frontend: Status update button not implemented',     'open'),
  ('Docker Compose configuration incomplete',            'open'),
  ('CI/CD pipeline not configured',                      'open')
ON CONFLICT DO NOTHING;
