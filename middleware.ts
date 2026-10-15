import { NextRequest, NextResponse } from "next/server";
import { canMutate } from "./lib/permissions";
import { SESSION_COOKIE, verifySessionToken } from "./lib/session";

const PUBLIC_PATHS = new Set([
  "/login",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/health",
]);

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function withSecurityHeaders(response: NextResponse) {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  );
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  );
  return response;
}

function isStaticPath(pathname: string) {
  return pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt";
}

function isAllowedMutationOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  try {
    const originUrl = new URL(origin);
    const forwardedHost = request.headers
      .get("x-forwarded-host")
      ?.split(",")[0]
      ?.trim();
    const host = forwardedHost || request.headers.get("host")?.trim();

    if (!host || originUrl.host !== host) return false;

    const forwardedProto = request.headers
      .get("x-forwarded-proto")
      ?.split(",")[0]
      ?.trim();

    if (forwardedProto && originUrl.protocol !== `${forwardedProto}:`) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (isStaticPath(pathname)) {
    return withSecurityHeaders(NextResponse.next());
  }

  if (MUTATING_METHODS.has(request.method) && !isAllowedMutationOrigin(request)) {
    return withSecurityHeaders(
      NextResponse.json({ error: "Cross-origin mutation blocked." }, { status: 403 }),
    );
  }

  const setting = process.env.HADI_STUDIO_AUTH_REQUIRED;
  const authRequired =
    setting === "true" ||
    (process.env.NODE_ENV === "production" && setting !== "false");

  if (!authRequired || PUBLIC_PATHS.has(pathname)) {
    return withSecurityHeaders(NextResponse.next());
  }

  const secret = process.env.HADI_AUTH_SECRET;
  if (!secret) {
    return withSecurityHeaders(
      NextResponse.json(
        { error: "HADI_AUTH_SECRET is required while authentication is enabled." },
        { status: 503 },
      ),
    );
  }

  const principal = await verifySessionToken(
    request.cookies.get(SESSION_COOKIE)?.value,
    secret,
  );

  if (!principal) {
    if (pathname.startsWith("/api/")) {
      return withSecurityHeaders(
        NextResponse.json({ error: "Authentication required." }, { status: 401 }),
      );
    }

    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("returnTo", pathname + request.nextUrl.search);
    return withSecurityHeaders(NextResponse.redirect(url));
  }

  if (MUTATING_METHODS.has(request.method) && !canMutate(principal.role)) {
    return withSecurityHeaders(
      NextResponse.json({ error: "Read-only session." }, { status: 403 }),
    );
  }

  const response = NextResponse.next();
  response.headers.set("x-hadi-role", principal.role);
  return withSecurityHeaders(response);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
