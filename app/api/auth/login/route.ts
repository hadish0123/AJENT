import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticatePassword, getAuthReadiness } from "@/lib/auth";
import { auditMutation } from "@/lib/audit";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";
import {
  createSessionToken,
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
} from "@/lib/session";

export const runtime = "nodejs";

const schema = z.object({
  password: z.string().min(8).max(512),
  returnTo: z.string().max(1000).optional().default("/"),
});

function safeReturnTo(value: string) {
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

function useSecureCookie() {
  if (process.env.HADI_COOKIE_SECURE === "false") return false;
  return process.env.NODE_ENV === "production";
}

export async function POST(request: Request) {
  const readiness = getAuthReadiness();
  if (!readiness.secretConfigured || !readiness.ownerPasswordConfigured) {
    return NextResponse.json(
      { error: "Studio authentication is not fully configured." },
      { status: 503 },
    );
  }

  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const key = `login:${forwarded || "unknown"}`;
  const rate = checkRateLimit(key, 8, 10 * 60 * 1000);

  if (!rate.allowed) {
    await auditMutation(request, {
      action: "auth.login.rate_limited",
      resourceType: "session",
      outcome: "failure",
    });
    return NextResponse.json(
      { error: "Too many login attempts. Try again later." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid login payload." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid login payload." }, { status: 400 });
  }

  const principal = authenticatePassword(parsed.data.password);
  if (!principal) {
    await auditMutation(request, {
      action: "auth.login.failed",
      resourceType: "session",
      outcome: "failure",
    });
    return NextResponse.json({ error: "Invalid password." }, { status: 401 });
  }

  resetRateLimit(key);
  const token = await createSessionToken(
    process.env.HADI_AUTH_SECRET!,
    principal,
  );

  const response = NextResponse.json({
    ok: true,
    role: principal.role,
    returnTo: safeReturnTo(parsed.data.returnTo),
  });

  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: useSecureCookie(),
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });

  await auditMutation(request, {
    action: "auth.login.success",
    resourceType: "session",
    resourceId: principal.sub,
    metadata: { role: principal.role },
  });

  return response;
}
