# QA & Browser Validation Protocol

Phase 05 adds a real validation loop after GitHub execution.

## Automated validation

GitHub Actions runs:

1. TypeScript typecheck
2. Unit tests with Vitest
3. Production build
4. Chromium smoke tests with Playwright

The browser suite starts the production Next.js server and validates:

- studio homepage rendering,
- navigation into project intake,
- health API readiness.

Playwright keeps traces/screenshots on failures and uploads the HTML report as a GitHub Actions artifact.

## Live Browser Operator validation

For deployed public HTTPS targets, ChatGPT can use the connected PRIME Browser Operator in an isolated browser session.

The live protocol covers:

- initial page load,
- primary navigation,
- main CTA,
- forms and validation,
- visible runtime failures,
- responsive behavior,
- screenshots for meaningful failures.

Browser findings are stored as QA checks or bugs.

## Bug loop

A failed QA check or unresolved bug moves the project back to `building` and the GitHub execution back to `coding`.

Bug records include:

- severity,
- status,
- description,
- reproduction steps,
- expected vs actual,
- code/path hint,
- assigned agent,
- fixed commit SHA.

After a fix, the bug can be marked `fixed`, then `verified` after re-testing.

## QA gate

A QA run passes only when:

- every required check exists,
- every required check is `passed`,
- no check is failed or blocked,
- no unresolved bug remains.

Default required checks:

- `typecheck`
- `unit`
- `build`
- `browser-smoke`

## API surface

- `GET /api/executions/:id/qa`
- `POST /api/executions/:id/qa`
- `GET /api/qa/:id`
- `POST /api/qa/:id/checks`
- `POST /api/qa/:id/bugs`
- `PATCH /api/bugs/:id`
