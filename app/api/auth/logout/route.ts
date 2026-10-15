import { NextResponse } from "next/server";
import { auditMutation } from "@/lib/audit";
import { SESSION_COOKIE } from "@/lib/session";

export const runtime = "nodejs";

function useSecureCookie() {
  if (process.env.HADI_COOKIE_SECURE === "false") return false;
  return process.env.NODE_ENV === "production";
}

export async function POST(request: Request) {
  await auditMutation(request, {
    action: "auth.logout",
    resourceType: "session",
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: useSecureCookie(),
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  return response;
}
