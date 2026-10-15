# Specialist Production Workflows

Phase 07 activates project-specific production policies on top of the shared Agent Council, GitHub execution, QA and Railway delivery pipeline.

## Active specialist workflows

### Telegram

Lead agent: `telegram`

Covers command/callback routing, conversation state, Telegram update ingestion, admin flows, idempotency and bot-secret handling.

The minimum secret name is `TELEGRAM_BOT_TOKEN`. HADI Dev Studio records variable names/policy only; secret values remain in the target environment.

### VPN / subscription

Lead agent: `vpn`

Activates for `vpn-panel` projects and for Telegram/admin/custom projects whose brief explicitly contains VPN/subscription scope.

Covers provider adapters, plan/order/service lifecycle, test/trial policy, renewals, quota/expiry synchronization and idempotent provisioning.

The exact panel API must be confirmed before implementation. Sanaei, Pasargad or another provider must not be treated as interchangeable without an adapter and capability check.

### Mobile

Lead agent: `mobile`

Covers navigation, client/network state, platform permissions, offline/error behavior, signing safety and reproducible platform builds.

### Game

Lead agent: `game`

Covers gameplay loop, game state, save/versioning rules, target performance budget and a playable smoke-test path.

### AI systems

Lead agent: `ai`

Covers model/provider boundaries, prompts, structured outputs, tool permissions, retrieval/evaluation, fallback and cost/latency controls.

Internal HADI Dev Studio agents still use ChatGPT directly; a separate AI API is not required solely to orchestrate the internal specialist council.

## Composite routing

More than one workflow can activate for one project.

Examples:

- Telegram VPN sales bot → Telegram + VPN
- Telegram AI assistant → Telegram + AI
- AI-enabled admin panel → AI plus the normal frontend/backend/database agents

## Enforcement points

Specialist policies influence:

1. Agent Council prompts.
2. Specialist agent activation.
3. GitHub execution required checks.
4. QA required checks.
5. Project dashboard visibility.
6. Environment-variable name planning.
7. Release gates and risk controls.

## Safety and correctness rules

- Secret values must not be committed to GitHub.
- Provider capabilities must be verified rather than guessed.
- External model output that controls application behavior must be validated.
- VPN provisioning and payment confirmation are separate states.
- Mobile signing credentials remain outside source control.
- Game save migrations require compatibility/recovery consideration.
- Telegram privileged actions cannot rely solely on usernames/display names.
