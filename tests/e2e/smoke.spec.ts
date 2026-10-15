import { expect, test, type Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Studio password").fill(
    process.env.HADI_STUDIO_PASSWORD || "ci-owner-password",
  );
  await page.getByRole("button", { name: /enter hadi dev studio/i }).click();
  await expect(page).toHaveURL("/");
}

test("studio homepage loads and exposes the current workflow", async ({ page }) => {
  await login(page);
  await expect(page.getByRole("heading", { name: /build serious software/i })).toBeVisible();
  await expect(page.getByText(/HADI Dev Studio/i).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /new project/i })).toBeVisible();
  await expect(page.getByText("100%")).toBeVisible();
});

test("new project intake page is reachable", async ({ page }) => {
  await login(page);
  await page.getByRole("link", { name: /new project/i }).click();
  await expect(page).toHaveURL(/\/projects\/new$/);
  await expect(page.getByRole("heading", { name: /create a new build/i })).toBeVisible();
});

test("unauthenticated studio access redirects to login", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("/");
  await expect(page).toHaveURL(/\/login/);
  await context.close();
});

test("health endpoint reports service liveness", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBe(true);

  const body = await response.json();
  expect(body.ok).toBe(true);
  expect(body.service).toBe("hadi-dev-studio");
  expect(body.version).toBe("1.0.0");
});
