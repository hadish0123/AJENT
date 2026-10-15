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

GitHub Execution / Phase 04 — 50%.

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000

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

GitHub mutations are executed by ChatGPT through the connected GitHub tool. The control plane stores the durable execution plan, working branch, applied changes, commit SHAs, PR metadata, required checks and merge-readiness gate.

## Persistence

PostgreSQL stores:

- projects,
- agent runs,
- agent outputs,
- GitHub executions,
- execution changes,
- execution checks.

Reference migrations are stored in `db/001_projects.sql`, `db/002_agent_runs.sql`, and `db/003_github_execution.sql`.

## Delivery status

GitHub foundation through Phase 04 is complete. Railway deployment remains blocked until the connected Railway account can create new projects.
