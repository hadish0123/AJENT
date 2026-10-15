# HADI Dev Studio

Private AI-assisted software factory for Hadi.

## Goal

Use ChatGPT as the reasoning/orchestration layer and GitHub + Railway + browser testing as the execution surface for real software projects.

## Supported project types

- Websites & landing pages
- Telegram bots
- Admin panels
- VPN subscription panels
- Mobile apps
- Games
- AI systems
- Custom software

## Current phase

QA & Browser Testing / Phase 05 — 65%.

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000

## QA commands

```bash
npm run typecheck
npm run test:unit
npm run build
npx playwright install chromium
npm run test:e2e
```

## Required environment

```env
DATABASE_URL=postgresql://user:password@host:5432/database
```

## Project API

- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/:id`
- `PATCH /api/projects/:id`

## Agent Council API

- `GET /api/projects/:id/runs`
- `POST /api/projects/:id/runs`
- `GET /api/runs/:id`
- `POST /api/runs/:id/outputs`

## GitHub Execution API

- `GET /api/runs/:id/execution`
- `POST /api/runs/:id/execution`
- `GET /api/executions/:id`
- `PATCH /api/executions/:id`
- `POST /api/executions/:id/changes`
- `POST /api/executions/:id/checks`

## QA API

- `GET /api/executions/:id/qa`
- `POST /api/executions/:id/qa`
- `GET /api/qa/:id`
- `POST /api/qa/:id/checks`
- `POST /api/qa/:id/bugs`
- `PATCH /api/bugs/:id`

## Browser validation

GitHub Actions runs a real Chromium browser suite with Playwright against the production build. For deployed public HTTPS targets, ChatGPT can also use the connected PRIME Browser Operator for isolated live browser validation and screenshot-backed bug reporting.

## Bug loop

Failed checks or unresolved QA bugs move work back to `building` / `coding`. A QA run passes only when every required check is green and every bug is verified or explicitly marked wont-fix.

## Persistence

PostgreSQL stores:

- projects,
- agent runs,
- agent outputs,
- GitHub executions,
- execution changes,
- execution checks,
- QA runs,
- QA checks,
- QA bugs.

Reference migrations are stored in `db/001_projects.sql`, `db/002_agent_runs.sql`, `db/003_github_execution.sql`, and `db/004_qa_browser.sql`.

## Delivery status

GitHub foundation through Phase 05 is complete. Railway deployment remains blocked until the connected Railway account can create new projects.
