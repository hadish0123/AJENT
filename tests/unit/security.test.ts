import { describe, expect, it } from "vitest";
import { canMutate, hasPermission } from "../../lib/permissions";
import { createSessionToken, verifySessionToken } from "../../lib/session";
import { checkRateLimit, resetRateLimit } from "../../lib/rate-limit";

describe("production security", () => {
  it("signs and verifies owner sessions", async () => {
    const token = await createSessionToken("test-secret-at-least-long-enough", {
      sub: "hadi",
      role: "owner",
    }, 60);

    await expect(
      verifySessionToken(token, "test-secret-at-least-long-enough"),
    ).resolves.toEqual({ sub: "hadi", role: "owner" });
  });

  it("rejects tampered sessions", async () => {
    const token = await createSessionToken("test-secret-at-least-long-enough", {
      sub: "hadi",
      role: "owner",
    }, 60);

    const tampered = token.slice(0, -1) + (token.endsWith("a") ? "b" : "a");
    await expect(
      verifySessionToken(tampered, "test-secret-at-least-long-enough"),
    ).resolves.toBeNull();
  });

  it("keeps auditor sessions read-only", () => {
    expect(hasPermission("auditor", "studio:read")).toBe(true);
    expect(hasPermission("auditor", "audit:read")).toBe(true);
    expect(canMutate("auditor")).toBe(false);
    expect(canMutate("owner")).toBe(true);
  });

  it("rate limits repeated login attempts", () => {
    const key = "unit-rate-limit";
    resetRateLimit(key);

    expect(checkRateLimit(key, 2, 60_000).allowed).toBe(true);
    expect(checkRateLimit(key, 2, 60_000).allowed).toBe(true);
    expect(checkRateLimit(key, 2, 60_000).allowed).toBe(false);

    resetRateLimit(key);
  });
});
