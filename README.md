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

Agent Orchestration / Phase 03 — 35%.

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

## Health check

`GET /api/health`

## Agent registry

`GET /api/agents`

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

The council runs through `analysis → debate → review → lead`. ChatGPT executes the logical roles and submits structured outputs; Phase 03 does not require a separate AI API.

## Persistence

PostgreSQL stores projects, agent runs and structured agent outputs. Reference migrations are stored in `db/001_projects.sql` and `db/002_agent_runs.sql`.

## Delivery status

GitHub foundation through Phase 03 is complete. Railway deployment remains blocked until the connected Railway account can create new projects.
