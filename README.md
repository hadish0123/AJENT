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

Project Intake / Phase 02 — 20%.

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

## Persistence

The Phase 02 persistence layer uses PostgreSQL. The application creates the required project table and index on first access. The SQL reference migration is also stored in `db/001_projects.sql`.

## Delivery status

GitHub foundation and Phase 02 are complete. Railway deployment remains blocked until the connected Railway account can create new projects.
