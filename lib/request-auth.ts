import type { RequestCookies } from "next/dist/compiled/@edge-runtime/cookies";
import { hasPermission, type StudioPermission } from "./permissions";
import {
  SESSION_COOKIE,
  verifySessionToken,
  type SessionPrincipal,
} from "./session";

function parseCookieHeader(header: string | null) {
  const cookies = new Map<string, string>();
  if (!header) return cookies;

  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index < 0) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (key) cookies.set(key, decodeURIComponent(value));
  }

  return cookies;
}

export async function getRequestPrincipal(
  request: Request,
): Promise<SessionPrincipal | null> {
  if (process.env.HADI_STUDIO_AUTH_REQUIRED !== "true") {
    return { sub: "local-development", role: "owner" };
  }

  const token = parseCookieHeader(request.headers.get("cookie")).get(SESSION_COOKIE);
  return verifySessionToken(token, process.env.HADI_AUTH_SECRET);
}

export async function requestHasPermission(
  request: Request,
  permission: StudioPermission,
) {
  const principal = await getRequestPrincipal(request);
  return Boolean(principal && hasPermission(principal.role, permission));
}

export class AuthorizationError extends Error {
  status: number;

  constructor(message = "Forbidden.", status = 403) {
    super(message);
    this.status = status;
  }
}

export async function requirePermission(
  request: Request,
  permission: StudioPermission,
) {
  const principal = await getRequestPrincipal(request);
  if (!principal) throw new AuthorizationError("Authentication required.", 401);
  if (!hasPermission(principal.role, permission)) {
    throw new AuthorizationError("Permission denied.", 403);
  }
  return principal;
}
