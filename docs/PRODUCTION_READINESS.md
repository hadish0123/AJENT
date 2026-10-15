# Production Readiness — HADI Dev Studio v1.0.0

## Application

- [x] Strict TypeScript build.
- [x] Structured Zod validation on mutation payloads.
- [x] PostgreSQL persistence.
- [x] Agent Council orchestration.
- [x] GitHub execution control plane.
- [x] QA and bug loop.
- [x] Playwright Chromium validation.
- [x] Specialist workflows.
- [x] Railway delivery control plane.

## Security

- [x] Production authentication defaults to enabled.
- [x] Owner password remains in environment configuration.
- [x] HMAC-signed HttpOnly session cookie.
- [x] SameSite=Strict session cookie.
- [x] Owner mutation permissions.
- [x] Auditor read-only permissions.
- [x] Cross-origin mutation rejection.
- [x] CSP, frame, referrer, MIME and permissions headers.
- [x] Login rate limiting.
- [x] Secrets excluded from GitHub and audit metadata.
- [x] Audit metadata redacts password/token/secret/key/cookie fields.

## Reliability

- [x] Health endpoint.
- [x] Protected readiness endpoint checks database and auth configuration.
- [x] Recovery controls avoid destructive infrastructure/database actions.
- [x] Failed execution checks can be reset to pending.
- [x] Failed QA creates a fresh validation run.
- [x] Failed delivery can return to planned while keeping reusable infrastructure IDs.
- [x] Railway delivery never claims success without healthy external state.

## Verification

- [x] Unit tests.
- [x] Production build.
- [x] Authenticated browser smoke tests.
- [x] PostgreSQL-backed end-to-end control-plane acceptance test.
- [x] GitHub Actions required verification workflow.

## Production environment variables

Required:

- `DATABASE_URL`
- `HADI_STUDIO_AUTH_REQUIRED=true`
- `HADI_STUDIO_PASSWORD`
- `HADI_AUTH_SECRET` (32+ random characters recommended)

Optional:

- `HADI_STUDIO_OWNER`
- `HADI_STUDIO_AUDITOR`
- `HADI_STUDIO_AUDITOR_PASSWORD`

Project-specific specialist variables are added by the specialist workflow and Railway delivery plan.

## External deployment status

AJENT cannot yet be provisioned live on the connected Railway account because Railway currently reports that the account trial has expired. This is an external account-plan blocker. Application implementation and CI acceptance are independent of that blocker.

After Railway account activation:

1. Create private AJENT Railway project.
2. Deploy a verified PostgreSQL template.
3. Deploy `hadish0123/AJENT` from `main`.
4. Set `DATABASE_URL`, auth password and auth secret.
5. Apply RAILPACK build/start/health/restart settings.
6. Generate the Railway public domain.
7. Wait for healthy deployment status.
8. Run live Browser Operator acceptance against the HTTPS domain.
