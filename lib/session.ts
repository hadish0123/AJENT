export const SESSION_COOKIE = "hadi_studio_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 8;

export type StudioRole = "owner" | "auditor";

export type SessionPrincipal = {
  sub: string;
  role: StudioRole;
};

type SessionPayload = SessionPrincipal & {
  iat: number;
  exp: number;
  nonce: string;
};

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlToBytes(input: string) {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4 || 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function encodePayload(payload: SessionPayload) {
  return bytesToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
}

function decodePayload(input: string): SessionPayload | null {
  try {
    const json = new TextDecoder().decode(base64UrlToBytes(input));
    const parsed = JSON.parse(json) as Partial<SessionPayload>;
    if (
      typeof parsed.sub !== "string" ||
      (parsed.role !== "owner" && parsed.role !== "auditor") ||
      typeof parsed.iat !== "number" ||
      typeof parsed.exp !== "number" ||
      typeof parsed.nonce !== "string"
    ) {
      return null;
    }
    return parsed as SessionPayload;
  } catch {
    return null;
  }
}

async function importKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function createSessionToken(
  secret: string,
  principal: SessionPrincipal,
  ttlSeconds = SESSION_TTL_SECONDS,
) {
  const now = Math.floor(Date.now() / 1000);
  const nonceBytes = new Uint8Array(16);
  crypto.getRandomValues(nonceBytes);

  const payload: SessionPayload = {
    ...principal,
    iat: now,
    exp: now + ttlSeconds,
    nonce: bytesToBase64Url(nonceBytes),
  };

  const encoded = encodePayload(payload);
  const signature = new Uint8Array(
    await crypto.subtle.sign(
      "HMAC",
      await importKey(secret),
      new TextEncoder().encode(encoded),
    ),
  );

  return `${encoded}.${bytesToBase64Url(signature)}`;
}

export async function verifySessionToken(
  token: string | undefined | null,
  secret: string | undefined | null,
): Promise<SessionPrincipal | null> {
  if (!token || !secret) return null;

  const [encoded, signaturePart, ...extra] = token.split(".");
  if (!encoded || !signaturePart || extra.length) return null;

  const payload = decodePayload(encoded);
  if (!payload || payload.exp <= Math.floor(Date.now() / 1000)) return null;

  try {
    const valid = await crypto.subtle.verify(
      "HMAC",
      await importKey(secret),
      base64UrlToBytes(signaturePart),
      new TextEncoder().encode(encoded),
    );

    return valid ? { sub: payload.sub, role: payload.role } : null;
  } catch {
    return null;
  }
}
