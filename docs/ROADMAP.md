# Roadmap

## Phase 01 — Foundation — 10%

- [x] Private HADI Dev Studio ChatGPT plugin
- [x] GitHub repository foundation
- [x] Professional control-plane UI shell
- [x] Agent registry
- [x] Project type registry
- [x] Health endpoint
- [x] Architecture + project memory docs
- [ ] Live Railway project provisioning for AJENT (externally blocked by Railway account plan)

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

- [x] Durable Railway delivery model
- [x] Railway project/environment/service/deployment ID synchronization
- [x] GitHub-to-Railway delivery plan
- [x] RAILPACK build/start/health/restart configuration contract
- [x] Environment variable name synchronization without secret storage
- [x] DATABASE_URL delivery requirement
- [x] Public domain synchronization
- [x] Build/deploy/runtime log evidence
- [x] Health monitoring state
- [x] Production delivery gate
- [x] QA-to-Railway workflow and delivery dashboard
- [x] Tool-facing Railway APIs and protocol
- [ ] Live AJENT Railway project creation (account currently returns trial expired)

## Phase 07 — Specialist workflows — 92%

- [x] Telegram bot workflow
- [x] VPN/subscription workflow
- [x] Mobile application workflow
- [x] Game-development workflow
- [x] AI-system workflow
- [x] Composite routing for Telegram + VPN and Telegram + AI scopes
- [x] Dedicated AI Systems Agent
- [x] Specialist policy injection into Agent Council prompts
- [x] Specialist task-graph routing from project brief
- [x] Specialist GitHub execution gates
- [x] Specialist QA gates
- [x] Specialist environment-variable name planning
- [x] Specialist project dashboard
- [x] Specialist control-center page and API
- [x] Unit tests for specialist routing and gates

## Phase 08 — Production hardening — 100%

- [x] Private password authentication
- [x] Signed HttpOnly session cookies
- [x] Owner/auditor role permissions
- [x] Same-origin mutation protection
- [x] Security headers and CSP
- [x] Login rate limiting
- [x] Durable PostgreSQL audit log
- [x] Mutation/tool-handoff audit events
- [x] Recovery controls for project/execution/QA/delivery state
- [x] Readiness endpoint
- [x] PostgreSQL-backed authenticated CI
- [x] Full intake → council → GitHub → QA → delivery acceptance test
- [x] Final operational documentation
- [x] Production-readiness checklist
