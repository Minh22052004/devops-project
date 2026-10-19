# Bug Tracker System — DevOps Mini-Project

**COMP1682.2 · DevOps Fundamentals · Greenwich Vietnam**

> **Fork this repo (once, by the Team Leader) and build a complete CI/CD pipeline around the application.**
> Assessment is on the pipeline you build — not on adding new features.

---

## Quick Start

**Workflow (no pull request ever goes to the lecturer):**

1. The **Team Leader** forks `longndt/devops-project` **once** and renames the fork (e.g. `comp1682-group-1`). This fork is your group's repository; the original repo is only a starting template.
2. The Team Leader invites all teammates as **Collaborators (Write role)** and invites the lecturer (`longndt`).
3. Every member clones **the leader's fork**, works on a feature branch, and opens a pull request into `main` of that fork. A teammate reviews/approves; the **Team Leader merges**.

```bash
git clone https://github.com/<TEAM_LEADER_USERNAME>/<YOUR_REPO>.git
cd <YOUR_REPO>
```

Stack: **React** (port 3000) · **Node.js/Express** (port 8080) · **PostgreSQL 15** (port 5432)

---

## What You Need to Do

Five compulsory tasks, one optional challenge for bonus points.

---

### Task 1 — Fix 6 Backend Bugs in `backend/server.js`

The backend has **6 intentional bugs**. Find and fix them all. Your automated tests tell you exactly which ones are still broken.

| # | Location | Bug | Fix |
|---|----------|-----|-----|
| 1 | `server.js` ~line 14 | Wrong default DB password | Change `'wrongpassword'` → `'bugpassword'` |
| 2 | `POST /api/bugs` | Accepts empty/whitespace-only titles without error | Add `if (!title \|\| !title.trim())` → return 400 |
| 3 | `server.js` | `DELETE /api/bugs/:id` not implemented | Add the full DELETE route |
| 4 | `server.js` | `PUT /api/bugs/:id` not implemented | Add the full PUT route (accepts `{ title, status }`) |
| 5 | `server.js` (bottom) | `app.listen()` runs unconditionally — port conflict during tests | Wrap with `if (require.main === module) { app.listen(...) }` |
| 6 | `server.js` (bottom) | `module.exports` commented out — test file can't import the app | Add `module.exports = app;` at the very end |

> **Start with Bug #6.** Until `module.exports = app` exists, 0/7 tests run.
> Fix Bugs #5 and #6 → 3/7 pass. Fix all 6 → 7/7 pass.

---

### Task 2 — Complete the Dockerfiles

Both `backend/Dockerfile` and `frontend/Dockerfile` are skeletons. Implement **multi-stage builds**.

**Backend** (`backend/Dockerfile`):
```dockerfile
# Stage 1: install production dependencies only
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Stage 2: lean runtime image
FROM node:24-alpine AS production
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
USER node
EXPOSE 8080
CMD ["node", "server.js"]
```

**Frontend** (`frontend/Dockerfile`):
```dockerfile
# Stage 1: build the React app into static files
FROM node:24-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# REACT_APP_* values are baked into the JavaScript bundle at BUILD time
ARG REACT_APP_API_URL=http://localhost:8080
ENV REACT_APP_API_URL=$REACT_APP_API_URL
RUN npm run build

# Stage 2: serve the static files
FROM node:24-alpine AS production
ENV NODE_ENV=production
WORKDIR /app
RUN npm install -g serve@14
COPY --from=builder /app/build ./build
USER node
EXPOSE 3000
CMD ["serve", "-s", "build", "-l", "3000"]
```

> **Why `ARG`/`ENV` in the frontend?**
> `REACT_APP_*` variables are baked into the JavaScript bundle **at build time** (`npm run build`), not at container startup. Passing the backend URL as a Docker build argument is the only way to embed it correctly.

Also create `.dockerignore` in both `backend/` and `frontend/` to exclude `node_modules`, `.env`, and `.git` from the build context (the frontend one should also exclude `build`).

---

### Task 3 — Complete `docker-compose.yml`

The `docker-compose.yml` is a skeleton. Copy `.env.example` to `.env` (never commit it) and read the database settings from it with `${DB_NAME}`-style variables instead of hard-coding passwords. Complete the file so all three services run together:

```bash
cp .env.example .env
docker compose up --build -d
```

| Service | Required Config |
|---------|----------------|
| `postgres` | Image `postgres:15-alpine` · env vars (`POSTGRES_DB=bugdb`, `POSTGRES_USER=postgres`, `POSTGRES_PASSWORD=bugpassword`) · port `5432:5432` (so tests on your laptop can reach it) · named volume · init script mount (`./database/database.sql`) · healthcheck |
| `backend` | Port `8080:8080` · env vars (`DB_HOST=postgres`, `DB_NAME=bugdb`, `DB_USER=postgres`, `DB_PASSWORD=bugpassword`) · `depends_on: postgres` with `condition: service_healthy` · healthcheck |
| `frontend` | Port `3000:3000` · build arg `REACT_APP_API_URL: http://localhost:8080` · `depends_on: backend` with `condition: service_healthy` |

> If you change `database.sql` after Postgres has already started, run `docker compose down -v` first.

---

### Task 4 — Complete the CI/CD Pipeline

| File | What it does | Your task |
|------|-------------|-----------|
| `.github/workflows/ci.yml` | Runs all tests on every push and PR (the backend job already starts PostgreSQL and loads `database/database.sql`) | Uncomment the frontend test section (clearly marked in the file) once frontend tests pass locally |
| `.github/workflows/cd.yml` | Builds Docker images and deploys after merging to `main` | Complete the **4 TODOs** inside the file |

**`cd.yml` — Your 4 TODOs:**

| TODO | What to implement |
|------|-------------------|
| 1 | Log in to Docker Hub using `docker/login-action@v4` with the `DOCKER_HUB_USERNAME` / `DOCKER_HUB_TOKEN` secrets |
| 2 | Build and push the **backend** image with two tags: `your-username/bug-tracker-backend:latest` and `...:${{ github.sha }}` |
| 3 | Build and push the **frontend** image (same two tags), passing `REACT_APP_API_URL=${{ vars.BACKEND_URL }}` as a build argument |
| 4 | Deploy — choose **Option A** (SSH to VPS) or **Option B** (Render.com) |

**Deployment Options:**

| | Option A — VPS / SSH | Option B — Render.com |
|---|---|---|
| How | SSH in and run `docker compose pull && up` | Trigger a deploy hook via `curl` |
| Database | PostgreSQL on your VPS | Render Managed PostgreSQL (free tier) |
| Difficulty | Higher — closest to real production | Lower — good for quick demos |
| Secrets needed | `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY` | `RENDER_DEPLOY_HOOK_BACKEND`, `RENDER_DEPLOY_HOOK_FRONTEND` |

**GitHub Secrets and Variables to add** (Settings → Secrets and variables → Actions):

| Name | Type | Required For |
|------|------|-------------|
| `DOCKER_HUB_USERNAME` | Secret | Both options |
| `DOCKER_HUB_TOKEN` | Secret (a Docker Hub *access token*, not your password) | Both options |
| `BACKEND_URL` | **Variable** (public URL, e.g. `http://<server-ip>:8080` or `https://<name>.onrender.com`) | Both options |
| `SSH_HOST` | Secret | Option A only |
| `SSH_USER` | Secret | Option A only |
| `SSH_PRIVATE_KEY` | Secret (a dedicated deploy key, one per group) | Option A only |
| `RENDER_DEPLOY_HOOK_BACKEND` | Secret | Option B only |
| `RENDER_DEPLOY_HOOK_FRONTEND` | Secret | Option B only |

---

### Task 5 — GitHub Repository Configuration

**Branch Protection** (Settings → Branches → Add rule):
- Branch pattern: `main`
- ✅ Require a pull request before merging (min. 1 approval)
- ✅ Require status checks to pass before merging (add the CI check named `test`)
- ✅ Do not allow bypassing the above settings

**Commit Message Convention** — all commits must follow [Conventional Commits](https://www.conventionalcommits.org/):

| Type | Example |
|------|---------|
| `feat:` | `feat: add DELETE /api/bugs/:id endpoint` |
| `fix:` | `fix: wrap app.listen in require.main guard` |
| `ci:` | `ci: add github actions pipeline` |
| `docs:` | `docs: update README with setup steps` |
| `chore:` | `chore: add .dockerignore for backend and frontend` |

---

## Optional Challenge (+10 Bonus Points)

Once you fix all 6 backend bugs, the API fully supports CRUD. However, the **frontend has empty stub functions** `deleteBug` and `cycleStatus` and no buttons for them. Make them work. Look for the `OPTIONAL CHALLENGE` comments in `frontend/src/App.jsx`.

**Challenge 1 — Delete Button**: implement `deleteBug(id)` — call `DELETE /api/bugs/:id`, then `fetchBugs()` — and add a button whose label contains "Delete".

**Challenge 2 — Status Cycle Button**: implement `cycleStatus(bug)` — cycle `open → in_progress → closed → open` by calling `PUT /api/bugs/:id` with `{ title, status }` — and add a button whose label shows the status or the next action (e.g. "Start", "Close", "Reopen").

Uncomment the two challenge tests at the bottom of `frontend/src/__tests__/App.test.jsx` and make them pass. CI must stay green.

---

## Running Tests Locally

```bash
# Backend (requires a running PostgreSQL instance WITH the schema loaded).
# Easiest: start only the database from docker-compose (it loads database/database.sql
# on first start), then run the tests against localhost:5432
cp .env.example .env
docker compose up -d postgres
cd backend
cp .env.example .env     # DB_HOST=localhost ... DB_NAME=bugdb DB_PASSWORD=bugpassword
npm ci
npm test

# Expected results:
#   0 / 7 pass  — before any fixes (Bug #6 blocks all tests)
#   3 / 7 pass  — after fixing Bugs #5 and #6
#   7 / 7 pass  — after fixing all 6 bugs  ✓

# Frontend (no backend needed — fetch is mocked)
cd frontend
npm ci
npm test
# Expected: 7 / 7 pass (9 / 9 if you enable both challenge tests)
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/bugs` | Return all bugs, newest first |
| `POST` | `/api/bugs` | Create a bug (`{ title }` — must be non-empty) |
| `PUT` | `/api/bugs/:id` | Update title or status (`{ title, status }`) |
| `DELETE` | `/api/bugs/:id` | Delete a bug permanently |
| `GET` | `/health` | Health check — returns `{ status: "healthy" }` |

Valid status values: `open` · `in_progress` · `closed`

---

## Repository Structure

```
devops-project/
├── backend/
│   ├── server.js               ← Main server — FIX THE 6 BUGS HERE
│   ├── tests/bugs.test.js      ← 7 automated tests (read these carefully)
│   ├── Dockerfile              ← Skeleton — you must complete this
│   └── package.json
├── frontend/
│   ├── src/App.jsx             ← Main UI (stub functions for Optional Challenge)
│   ├── src/__tests__/App.test.jsx ← 7 frontend tests (+ 2 challenge tests, commented)
│   ├── Dockerfile              ← Skeleton — you must complete this
│   └── package.json
├── database/
│   └── database.sql            ← Creates bugs table + seed data (auto-runs on first start)
├── docker-compose.yml          ← Skeleton — you must complete this
├── .github/workflows/
│   ├── ci.yml                  ← Pre-configured — uncomment one section
│   └── cd.yml                  ← Skeleton — complete the 4 TODOs
```

---

## Demo Flow — Fail → Fix → Pass

1. Show the live app running with real data
2. Create a branch, intentionally break a test, push, open a PR → **show CI failing (Red ✗)**
3. Walk through the Actions log — explain which test failed and why; show the PR is blocked from merging
4. Fix the test, push → **show CI passing (Green ✓)**
5. Get team member approval → Team Leader merges the PR
6. Show the CD workflow triggering automatically in the Actions tab
7. Refresh the live app — show the change is now on the production server

> Make a small visible change (e.g., edit the subtitle in `frontend/src/App.jsx`) for Step 7 so the lecturer can see the update without inspecting code.

---

## Submission Checklist

**Git & GitHub**
- [ ] `main` branch protection enabled — direct push blocked for everyone
- [ ] All changes merged via Pull Requests with at least 1 team member approval
- [ ] All commits follow Conventional Commits
- [ ] Lecturer (`longndt`) and all team members invited as repository collaborators

**Containerization**
- [ ] `backend/Dockerfile` — multi-stage, `node:24-alpine`, `EXPOSE 8080`
- [ ] `frontend/Dockerfile` — multi-stage, `REACT_APP_API_URL` build arg, `serve` in stage 2
- [ ] `.dockerignore` in both `backend/` and `frontend/`
- [ ] `docker-compose.yml` — 3 services, named volume, healthchecks, `depends_on` with health conditions
- [ ] App runs with `docker compose up --build -d`

**CI/CD**
- [ ] `ci.yml` runs on every push and PR — PR shows green/red status check
- [ ] Frontend test section uncommented in `ci.yml`
- [ ] All 4 TODOs completed in `cd.yml`
- [ ] Required GitHub Secrets added
- [ ] Merging a PR to `main` triggers automatic deployment

**Code & Tests**
- [ ] All 6 bugs in `backend/server.js` fixed
- [ ] 7 / 7 backend tests pass
- [ ] 7 / 7 frontend tests pass
- [ ] Live app loads, connects to the database, and bugs are displayed

**Deliverables**
- [ ] Group Report written and exported as PDF (cover page must include GitHub repo URL, Docker Hub URL, live app URL)
- [ ] Presentation slides ready (PPTX or PDF) — all members have a speaking role
- [ ] Source code ZIP exported from GitHub (Code → Download ZIP)

---

## Assessment (100%)

| Criteria | Weight |
|----------|--------|
| Functionality (pipeline end-to-end, CI blocks broken code, CD auto-deploys) | 40% |
| Technical Understanding (explain Dockerfile stages, workflow syntax, secrets) | 30% |
| Collaboration (commit history, PR reviews, all members contributed) | 15% |
| Presentation (clear demo, all members speak, 10–15 min) | 15% |
| Optional Challenge bonus | +10 pts |

> **The CI pipeline must fail when tests are broken.** Showing a deliberate Red ✗ run during the demo — then fixing it — earns significant marks.
