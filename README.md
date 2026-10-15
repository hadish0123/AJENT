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

Railway Delivery / Phase 06 — 80%.

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

## Railway Delivery API

- `GET /api/qa/:id/delivery`
- `POST /api/qa/:id/delivery`
- `GET /api/deliveries/:id`
- `PATCH /api/deliveries/:id`
- `POST /api/deliveries/:id/variables`
- `POST /api/deliveries/:id/logs`

## Railway delivery model

A Railway delivery can only be prepared after the QA gate passes. ChatGPT then uses the connected Railway tool to provision/synchronize infrastructure.

The default contract is:

- RAILPACK builder,
- `npm run build`,
- `npm run start`,
- `/api/health`,
- ON_FAILURE restart policy,
- required `DATABASE_URL`,
- public service domain,
- environment/deployment health monitoring.

HADI Dev Studio stores Railway IDs, variable names/status, domain, health and selected non-secret log evidence. It never stores plaintext Railway secret values.

## Browser validation

GitHub Actions runs a real Chromium browser suite with Playwright against the production build. For deployed public HTTPS targets, ChatGPT can also use the connected PRIME Browser Operator for isolated live browser validation and screenshot-backed bug reporting.

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
- QA bugs,
- Railway deliveries,
- Railway variable synchronization records,
- Railway log evidence.

Reference migrations are stored in `db/001_projects.sql`, `db/002_agent_runs.sql`, `db/003_github_execution.sql`, `db/004_qa_browser.sql`, and `db/005_railway_delivery.sql`.

## Railway account state

Phase 06 control-plane code is complete, but live AJENT provisioning is externally blocked because the connected Railway account currently returns: `Your trial has expired. Please select a plan to continue using Railway.`

No live Railway deployment is claimed until Railway confirms successful provisioning and health.
