/**
 * Personal PIN hashing with Web Crypto PBKDF2-SHA256.
 *
 * Works in the Cloudflare Workers runtime (no Node `crypto`, no native bcrypt).
 * The salt is generated per-PIN and stored inside the hash string:
 *
 *   pbkdf2$<iterations>$<saltB64>$<hashB64>
 *
 * ADR-0003: PINs are a "deter, don't prevent" identity signal.
 */

const ALGORITHM = "pbkdf2";
const ITERATIONS = 100_000;
const HASH_BITS = 256; // SHA-256 output, 32 bytes
const SALT_BYTES = 16;

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function pbkdf2(
  pin: string,
  salt: Uint8Array,
  iterations: number
): Promise<Uint8Array> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pin),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      // Copy into a fresh ArrayBuffer to satisfy BufferSource typing.
      salt: salt.slice(),
      iterations,
      hash: "SHA-256",
    },
    keyMaterial,
    HASH_BITS
  );
  return new Uint8Array(bits);
}

/** Hash a PIN into a self-describing `pbkdf2$...` string. */
export async function hashPin(pin: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await pbkdf2(pin, salt, ITERATIONS);
  return [
    ALGORITHM,
    ITERATIONS,
    bytesToBase64(salt),
    bytesToBase64(hash),
  ].join("$");
}

/** Constant-time comparison of two byte arrays. */
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/** Verify a PIN against a stored `pbkdf2$...` hash string. */
export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  const parts = hash.split("$");
  if (parts.length !== 4) return false;
  const [algorithm, iterationsRaw, saltB64, hashB64] = parts;
  if (algorithm !== ALGORITHM) return false;

  const iterations = Number.parseInt(iterationsRaw, 10);
  if (!Number.isFinite(iterations) || iterations <= 0) return false;

  let expected: Uint8Array;
  try {
    expected = base64ToBytes(hashB64);
    const salt = base64ToBytes(saltB64);
    const actual = await pbkdf2(pin, salt, iterations);
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
