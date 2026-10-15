# Agent Orchestration Protocol

HADI Dev Studio uses ChatGPT as the reasoning engine. The application stores orchestration state and structured outputs; it does not require a separate paid AI API for Phase 03.

## Stages

1. **analysis** — Requirements, Product and Architect independently establish scope and assumptions.
2. **debate** — Project-specific builder specialists challenge the analysis and propose implementation choices.
3. **review** — Security, QA and DevOps review feasibility, safety, testability and delivery risk.
4. **lead** — Lead Builder resolves disagreements and produces the final implementation direction.

A stage advances only when every agent assigned to that stage has submitted a valid structured result.

## Output contract

Each agent output contains:

- agent
- stage
- stance: approve / revise / block
- confidence: 0–100
- summary
- decisions[]
- risks[]
- actions[]
- questions[]
- artifacts[]

The Lead Builder output becomes the final report and records council consensus statistics.

## Tool-facing flow

1. Create a run: `POST /api/projects/:projectId/runs`
2. Read run and pending prompts: `GET /api/runs/:runId`
3. Execute each pending role in ChatGPT.
4. Submit each structured result: `POST /api/runs/:runId/outputs`
5. Repeat until the run is completed.
6. Use the final report as the input to the GitHub execution phase.

## Persistence

- `agent_runs` stores run state, stage plans, participants and final reports.
- `agent_outputs` stores one idempotent structured output per agent per stage.
- Project status moves from `intake` to `planned` when the Lead Builder completes the council.
