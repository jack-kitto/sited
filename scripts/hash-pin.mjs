#!/usr/bin/env node
// Dev utility: compute a PBKDF2-SHA256 PIN hash in the exact format used by
// src/lib/pin.ts ->  pbkdf2$<iterations>$<saltB64>$<hashB64>
//
// Usage:
//   node scripts/hash-pin.mjs 1234
//   node scripts/hash-pin.mjs 1234 5678 4321
//
// Used to generate the precomputed hashes embedded in scripts/seed-local.sh,
// because PINs are hashed at runtime and never stored in plaintext.

const ITERATIONS = 100_000;
const HASH_BITS = 256;
const SALT_BYTES = 16;

function bytesToBase64(bytes) {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

async function hashPin(pin) {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pin),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    HASH_BITS
  );
  const hash = new Uint8Array(bits);
  return ["pbkdf2", ITERATIONS, bytesToBase64(salt), bytesToBase64(hash)].join(
    "$"
  );
}

const pins = process.argv.slice(2);
if (pins.length === 0) {
  console.error("usage: node scripts/hash-pin.mjs <pin> [pin...]");
  process.exit(1);
}

for (const pin of pins) {
  console.log(`${pin}\t${await hashPin(pin)}`);
}
