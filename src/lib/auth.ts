import { cookies } from "next/headers";
import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Admin authentication: a single shared password (ADR-0003). On success we set
 * a signed, httpOnly session cookie (HMAC-SHA256 via Web Crypto) keyed by
 * env.SESSION_SECRET. There are no per-admin accounts.
 */

export const ADMIN_COOKIE_NAME = "admin_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

export type AdminSession = {
  role: "admin";
  /** Issued-at, epoch ms. */
  iat: number;
  /** Expiry, epoch ms. */
  exp: number;
};

function env(): CloudflareEnv {
  return getCloudflareContext().env;
}

function base64url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlToBytes(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  const binary = atob(b64 + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function utf8(s: string): Uint8Array<ArrayBuffer> {
  // Copy into a fresh ArrayBuffer-backed view so it satisfies BufferSource
  // (Web Crypto) regardless of which TextEncoder lib types are in scope.
  return new Uint8Array(new TextEncoder().encode(s));
}

/** Constant-time comparison of two byte arrays. */
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    utf8(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function sign(payloadB64: string, secret: string): Promise<string> {
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, utf8(payloadB64));
  return base64url(new Uint8Array(sig));
}

/**
 * Verify a plaintext admin password against env.ADMIN_PASSWORD using a
 * constant-time comparison.
 */
export async function verifyAdminPassword(pw: string): Promise<boolean> {
  const expected = env().ADMIN_PASSWORD;
  if (!expected) return false;
  return timingSafeEqual(utf8(pw), utf8(expected));
}

/** Serialize + sign a session into a `<payloadB64>.<sigB64>` token. */
async function encodeSession(
  session: AdminSession,
  secret: string
): Promise<string> {
  const payloadB64 = base64url(utf8(JSON.stringify(session)));
  const sig = await sign(payloadB64, secret);
  return `${payloadB64}.${sig}`;
}

/** Verify + parse a token, returning the session if valid and unexpired. */
async function decodeSession(
  token: string,
  secret: string
): Promise<AdminSession | null> {
  const dot = token.indexOf(".");
  if (dot < 0) return null;
  const payloadB64 = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  const expected = await sign(payloadB64, secret);
  if (!timingSafeEqual(base64urlToBytes(sig), base64urlToBytes(expected))) {
    return null;
  }

  try {
    const session = JSON.parse(
      new TextDecoder().decode(base64urlToBytes(payloadB64))
    ) as AdminSession;
    if (session.role !== "admin") return null;
    if (typeof session.exp !== "number" || session.exp < Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

/**
 * Create an admin session and set the signed httpOnly cookie. Call only after
 * `verifyAdminPassword` succeeds.
 */
export async function createAdminSession(): Promise<void> {
  const secret = env().SESSION_SECRET;
  const now = Date.now();
  const session: AdminSession = {
    role: "admin",
    iat: now,
    exp: now + SESSION_TTL_MS,
  };
  const token = await encodeSession(session, secret);
  const store = await cookies();
  store.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
}

/** Read and verify the current admin session, or null if not authenticated. */
export async function readAdminSession(): Promise<AdminSession | null> {
  const secret = env().SESSION_SECRET;
  if (!secret) return null;
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;
  return decodeSession(token, secret);
}

/** Clear the admin session cookie (logout). */
export async function destroyAdminSession(): Promise<void> {
  const store = await cookies();
  store.delete(ADMIN_COOKIE_NAME);
}

/**
 * Route-handler guard. Returns the session when authenticated, otherwise null
 * so the caller can respond with 401, e.g.:
 *
 *   const session = await requireAdmin();
 *   if (!session) return new Response("Unauthorized", { status: 401 });
 */
export async function requireAdmin(): Promise<AdminSession | null> {
  return readAdminSession();
}
