# Roadmap

## Phase 01 — Foundation — 10%

- [x] Private HADI Dev Studio ChatGPT plugin
- [x] GitHub repository foundation
- [x] Professional control-plane UI shell
- [x] Agent registry
- [x] Project type registry
- [x] Health endpoint
- [x] Architecture + project memory docs
- [ ] Railway deployment (blocked until Railway account can create projects)

## Phase 02 — Project intake — 20%

- [x] Project creation form
- [x] Requirements schema
- [x] Project status model
- [x] Durable PostgreSQL persistence
- [x] Automatic project-specific task graph
- [x] Project list and detail views
- [x] Project API: create, list, read, update

## Phase 03 — Agent orchestration — 35%

- [x] Agent run model
- [x] Stage planner by project type
- [x] Analysis / debate / review / lead stages
- [x] Structured agent output contract
- [x] Idempotent per-agent stage outputs
- [x] Automatic stage advancement
- [x] Consensus calculation
- [x] Lead Builder aggregation and final report
- [x] Agent Council dashboard
- [x] Tool-facing run APIs

## Phase 04 — GitHub execution — 50%

- [x] Execution plan generated from Lead Builder output
- [x] Deterministic working-branch strategy
- [x] Durable GitHub execution state
- [x] File-change tracking
- [x] Commit SHA tracking
- [x] Pull-request metadata lifecycle
- [x] Required review/check records
- [x] Merge-readiness gate
- [x] GitHub tool handoff contract for ChatGPT
- [x] Execution dashboard and APIs

## Phase 05 — QA & browser testing — 65%

- [x] Durable QA run/check/bug model
- [x] Typecheck gate
- [x] Unit-test pipeline with Vitest
- [x] Production build gate
- [x] Chromium browser smoke tests with Playwright
- [x] Playwright traces/screenshots/report artifacts on failure
- [x] Live PRIME Browser Operator validation contract
- [x] QA dashboard and tool-facing APIs
- [x] Bug severity/status/assignment/fixed-commit tracking
- [x] Automatic bug loop back to building/coding
- [x] QA gate requiring all checks green and zero unresolved bugs

## Phase 06 — Railway delivery — 80%

- Environment management
- Variables
- Deployment
- Logs
- Health monitoring

## Phase 07 — Specialist workflows — 92%

- Telegram
- VPN panel
- Mobile
- Game
- AI systems

## Phase 08 — Production hardening — 100%

- Auth
- Audit log
- Permissions
- Recovery
- Documentation
- End-to-end acceptance
