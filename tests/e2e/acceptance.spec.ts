import { expect, test, type Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Studio password").fill(
    process.env.HADI_STUDIO_PASSWORD || "ci-owner-password",
  );
  await page.getByRole("button", { name: /enter hadi dev studio/i }).click();
  await expect(page).toHaveURL("/");
}

test.describe("full control-plane acceptance", () => {
  test.skip(!process.env.DATABASE_URL, "DATABASE_URL is required for the full acceptance flow.");

  test("intake → council → GitHub → QA → delivery control plane", async ({ page }) => {
    await login(page);

    const projectResponse = await page.request.post("/api/projects", {
      data: {
        name: `Acceptance ${Date.now()}`,
        clientName: "CI",
        type: "website",
        brief: "Build a production-ready internal website with a simple dashboard and API-backed data.",
        budget: "test",
        deadline: "today",
        mustHave: ["Dashboard", "API"],
        constraints: ["No external secrets in source control"],
      },
    });
    expect(projectResponse.status()).toBe(201);
    const { project } = await projectResponse.json();

    const runResponse = await page.request.post(`/api/projects/${project.id}/runs`);
    expect(runResponse.status()).toBe(201);
    const { run } = await runResponse.json();

    for (let guard = 0; guard < 20; guard += 1) {
      const stateResponse = await page.request.get(`/api/runs/${run.id}`);
      expect(stateResponse.ok()).toBe(true);
      const state = await stateResponse.json();

      if (state.run.status === "completed") break;
      expect(state.next.length).toBeGreaterThan(0);

      for (const task of state.next) {
        const outputResponse = await page.request.post(
          `/api/runs/${run.id}/outputs`,
          {
            data: {
              agent: task.agent,
              stage: task.stage,
              stance: "approve",
              confidence: 95,
              summary: `Acceptance output from ${task.agent} for ${task.stage} with enough detail to satisfy the schema.`,
              decisions: [`Use the approved ${task.agent} approach.`],
              risks: [],
              actions: [`Implement the approved ${task.agent} deliverable.`],
              questions: [],
              artifacts: [`acceptance/${task.agent}.md`],
            },
          },
        );
        expect(outputResponse.ok()).toBe(true);
      }
    }

    const completedRunResponse = await page.request.get(`/api/runs/${run.id}`);
    const completedRun = await completedRunResponse.json();
    expect(completedRun.run.status).toBe("completed");
    expect(completedRun.run.finalReport).toBeTruthy();

    const executionResponse = await page.request.post(
      `/api/runs/${run.id}/execution`,
      {
        data: { repository: "hadish0123/AJENT", baseBranch: "main" },
      },
    );
    expect(executionResponse.status()).toBe(201);
    const { execution } = await executionResponse.json();

    const changeResponse = await page.request.post(
      `/api/executions/${execution.id}/changes`,
      {
        data: {
          path: "acceptance/control-plane.txt",
          operation: "create",
          summary: "Acceptance-only logical change record.",
          status: "applied",
          blobSha: "1111111111111111111111111111111111111111",
          commitSha: "2222222222222222222222222222222222222222",
        },
      },
    );
    expect(changeResponse.status()).toBe(201);

    const executionSync = await page.request.patch(
      `/api/executions/${execution.id}`,
      {
        data: {
          status: "review_ready",
          headSha: "3333333333333333333333333333333333333333",
          prNumber: 999999,
          prUrl: "https://github.com/hadish0123/AJENT/pull/999999",
        },
      },
    );
    expect(executionSync.ok()).toBe(true);

    const executionState = await (
      await page.request.get(`/api/executions/${execution.id}`)
    ).json();

    for (const checkName of executionState.execution.plan.requiredChecks) {
      const checkResponse = await page.request.post(
        `/api/executions/${execution.id}/checks`,
        {
          data: {
            name: checkName,
            status: "passed",
            details: "Acceptance gate passed.",
            url: "",
          },
        },
      );
      expect(checkResponse.status()).toBe(201);
    }

    const mergeReady = await (
      await page.request.get(`/api/executions/${execution.id}`)
    ).json();
    expect(mergeReady.mergeGate.ready).toBe(true);

    const completedExecutionResponse = await page.request.patch(
      `/api/executions/${execution.id}`,
      { data: { status: "completed" } },
    );
    expect(completedExecutionResponse.ok()).toBe(true);

    const qaResponse = await page.request.post(
      `/api/executions/${execution.id}/qa`,
      {
        data: {
          source: "ci",
          targetUrl: "",
          requiredChecks: ["typecheck", "unit", "build", "browser-smoke"],
        },
      },
    );
    expect(qaResponse.status()).toBe(201);
    const { run: qaRun } = await qaResponse.json();

    for (const [name, type] of [
      ["typecheck", "typecheck"],
      ["unit", "unit"],
      ["build", "build"],
      ["browser-smoke", "browser"],
    ] as const) {
      const qaCheckResponse = await page.request.post(
        `/api/qa/${qaRun.id}/checks`,
        {
          data: {
            type,
            name,
            status: "passed",
            details: "Acceptance validation passed.",
            evidenceUrl: "",
            durationMs: 1,
          },
        },
      );
      expect(qaCheckResponse.status()).toBe(201);
    }

    const qaState = await (
      await page.request.get(`/api/qa/${qaRun.id}`)
    ).json();
    expect(qaState.run.status).toBe("passed");
    expect(qaState.gate.ready).toBe(true);

    const deliveryResponse = await page.request.post(
      `/api/qa/${qaRun.id}/delivery`,
      {
        data: { repository: "hadish0123/AJENT", branch: "main" },
      },
    );
    expect(deliveryResponse.status()).toBe(201);
    const { delivery } = await deliveryResponse.json();

    const deliveryState = await (
      await page.request.get(`/api/deliveries/${delivery.id}`)
    ).json();
    expect(deliveryState.delivery.status).toBe("planned");
    expect(deliveryState.plan.requiredVariables).toContain("DATABASE_URL");
    expect(deliveryState.gate.ready).toBe(false);

    const auditResponse = await page.request.get("/api/audit?limit=100");
    expect(auditResponse.ok()).toBe(true);
    const audit = await auditResponse.json();
    const actions = audit.events.map((event: { action: string }) => event.action);

    expect(actions).toEqual(expect.arrayContaining([
      "project.create",
      "agent_run.create",
      "execution.create",
      "qa.create",
      "delivery.create",
    ]));
  });
});
