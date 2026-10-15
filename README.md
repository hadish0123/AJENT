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

Production Hardened / Final — 100% application/control-plane implementation.

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
HADI_STUDIO_AUTH_REQUIRED=true
HADI_STUDIO_OWNER=hadi
HADI_STUDIO_PASSWORD=use-a-long-private-password
HADI_AUTH_SECRET=use-at-least-32-random-characters
```

Optional read-only access:

```env
HADI_STUDIO_AUDITOR=auditor
HADI_STUDIO_AUDITOR_PASSWORD=another-long-password
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

## Specialist Workflow API

- `GET /api/projects/:id/specialists`

Specialist policies activate automatically for Telegram, VPN/subscription, mobile, game and AI projects. Composite routing is supported, so a Telegram VPN sales bot activates both Telegram and VPN workflows, while an AI-enabled Telegram bot activates Telegram + AI.

Specialist routing affects Agent Council prompts, task graphs, GitHub execution checks, QA checks, environment-variable name planning and release gates.

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

## Specialist agents

HADI Dev Studio now includes a dedicated `AI Systems Agent` in addition to Telegram, Mobile, Game and VPN specialists. Internal specialist roles are executed by ChatGPT; they do not require a separate paid AI API merely to coordinate the internal workflow.

## Production security

Production defaults to authenticated access. HADI Dev Studio uses signed HttpOnly session cookies, owner/auditor roles, same-origin mutation protection, security headers, login rate limiting, a durable audit log and controlled recovery endpoints.

Useful final endpoints:

- `GET /api/auth/session`
- `GET /api/audit`
- `GET /api/recovery`
- `POST /api/recovery`
- `GET /api/system/readiness`

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
- Railway log evidence,
- audit events.

Reference migrations are stored in `db/001_projects.sql` through `db/006_production_hardening.sql`.

## Railway account state

v1.0.0 application/control-plane implementation is complete, but live AJENT provisioning is externally blocked because the connected Railway account currently returns: `Your trial has expired. Please select a plan to continue using Railway.`

No live Railway deployment is claimed until Railway confirms successful provisioning and health.
