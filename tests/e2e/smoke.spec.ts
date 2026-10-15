import { expect, test } from "@playwright/test";

test("studio homepage loads and exposes the current workflow", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /build serious software/i })).toBeVisible();
  await expect(page.getByText(/HADI Dev Studio/i).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /new project/i })).toBeVisible();
});

test("new project intake page is reachable", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /new project/i }).click();
  await expect(page).toHaveURL(/\/projects\/new$/);
  await expect(page.getByRole("heading", { name: /create a new build/i })).toBeVisible();
});

test("health endpoint reports service readiness", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBe(true);

  const body = await response.json();
  expect(body.ok).toBe(true);
  expect(body.service).toBe("hadi-dev-studio");
});
