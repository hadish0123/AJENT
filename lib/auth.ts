import { createHash, timingSafeEqual } from "node:crypto";
import type { SessionPrincipal } from "./session";

export function isStudioAuthRequired() {
  return process.env.HADI_STUDIO_AUTH_REQUIRED === "true";
}

export function getAuthReadiness() {
  return {
    required: isStudioAuthRequired(),
    ownerPasswordConfigured: Boolean(process.env.HADI_STUDIO_PASSWORD),
    auditorPasswordConfigured: Boolean(process.env.HADI_STUDIO_AUDITOR_PASSWORD),
    secretConfigured: Boolean(process.env.HADI_AUTH_SECRET),
  };
}

function secureEqual(left: string, right: string) {
  const a = createHash("sha256").update(left).digest();
  const b = createHash("sha256").update(right).digest();
  return timingSafeEqual(a, b);
}

export function authenticatePassword(password: string): SessionPrincipal | null {
  const ownerPassword = process.env.HADI_STUDIO_PASSWORD;
  if (ownerPassword && secureEqual(password, ownerPassword)) {
    return {
      sub: process.env.HADI_STUDIO_OWNER || "hadi",
      role: "owner",
    };
  }

  const auditorPassword = process.env.HADI_STUDIO_AUDITOR_PASSWORD;
  if (auditorPassword && secureEqual(password, auditorPassword)) {
    return {
      sub: process.env.HADI_STUDIO_AUDITOR || "auditor",
      role: "auditor",
    };
  }

  return null;
}
