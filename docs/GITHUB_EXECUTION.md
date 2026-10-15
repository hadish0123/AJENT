# GitHub Execution Protocol

Phase 04 converts the Lead Builder's approved council result into a controlled GitHub delivery workflow.

## Principle

ChatGPT remains the orchestration brain and uses the connected GitHub tool directly. The HADI Dev Studio control plane persists execution state, change records, PR metadata and review gates.

No separate GitHub token is required inside the application for this workflow when execution is driven from ChatGPT.

## Lifecycle

1. Council completes and produces a Lead Builder final report.
2. Create an execution with repository + base branch.
3. HADI Dev Studio derives a working branch and execution plan.
4. ChatGPT verifies the base head and creates the working branch through GitHub.
5. ChatGPT applies file changes and records each change in HADI Dev Studio.
6. ChatGPT opens a pull request and syncs PR number, URL and head SHA.
7. CI/review results are recorded as checks.
8. Merge is allowed only when the merge gate is ready.
9. After merge, execution status becomes completed and the project becomes ready for QA/browser validation.

## Branch strategy

Generated branches follow:

`hadi/<project-slug>-<execution-id-prefix>`

Base branch defaults to `main`.

## Required merge checks

Phase 04 requires:

- typecheck
- build
- review

The merge gate also requires:

- at least one applied file change,
- zero failed file changes,
- a known head SHA,
- an opened pull request,
- all required checks present and passed.

## APIs

- `GET /api/runs/:runId/execution`
- `POST /api/runs/:runId/execution`
- `GET /api/executions/:id`
- `PATCH /api/executions/:id`
- `POST /api/executions/:id/changes`
- `POST /api/executions/:id/checks`

These endpoints are tool-facing synchronization surfaces. GitHub mutations themselves are executed by ChatGPT through the connected GitHub tool.
