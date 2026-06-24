#!/usr/bin/env node
// Platform Operator tool: provision a new Company (ADR-0004).
//
// Writes a `companies` row directly to D1 (no app-level super-admin in v1).
// The admin password is hashed with PBKDF2-SHA256 in the same format the app
// uses (src/lib/pin.ts) so the per-Company admin login can verify it.
//
// Usage (provision a new Company):
//   node scripts/provision-company.mjs \
//     --slug acme \
//     --name "Acme Construction Ltd" \
//     --timezone Asia/Tokyo \
//     --password "a-strong-password" \
//     [--remote]
//
// Usage (set/reset an existing Company's admin password — e.g. the first
// Company backfilled with a locked password by migration 0001):
//   node scripts/provision-company.mjs --set-password \
//     --slug wl --password "a-strong-password" [--remote]
//
// Defaults to the LOCAL D1 database. Pass --remote to target production.
//
// Slug rules (immutable, public, used in /{slug}/clock and /{slug}/admin):
//   - lowercase letters, digits, and hyphens only
//   - 2-32 characters
//   - must not start or end with a hyphen
//   - unique across the platform (enforced by the DB unique index)

import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

const DB_NAME = "sited-db";
const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_HASH_BITS = 256;
const PBKDF2_SALT_BYTES = 16;

/** Canonical Company Slug rule. Keep in sync with the app's slug validation. */
const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,30}[a-z0-9])?$/;

function fail(message) {
  console.error(`error: ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const args = { remote: false, setPassword: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case "--remote":
        args.remote = true;
        break;
      case "--set-password":
        args.setPassword = true;
        break;
      case "--slug":
      case "--name":
      case "--timezone":
      case "--password": {
        const value = argv[++i];
        if (value === undefined) fail(`${arg} requires a value`);
        args[arg.slice(2)] = value;
        break;
      }
      default:
        fail(`unknown argument: ${arg}`);
    }
  }
  return args;
}

function isValidTimezone(tz) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

function bytesToBase64(bytes) {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(PBKDF2_SALT_BYTES));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    PBKDF2_HASH_BITS
  );
  return ["pbkdf2", PBKDF2_ITERATIONS, bytesToBase64(salt), bytesToBase64(new Uint8Array(bits))].join("$");
}

/** Escape a value for single-quoted SQL string literals. */
function sqlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

/** Run a single SQL statement against D1 via wrangler, with cleanup. */
function executeSql(sql, remote, onError) {
  const dir = mkdtempSync(join(tmpdir(), "sited-provision-"));
  const file = join(dir, "statement.sql");
  writeFileSync(file, sql + "\n");
  const target = remote ? "--remote" : "--local";
  try {
    execFileSync(
      "npx",
      ["wrangler", "d1", "execute", DB_NAME, target, "--file", file],
      { stdio: "inherit" }
    );
  } catch {
    fail(onError);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

async function setPassword(args) {
  const { slug, password } = args;
  if (!slug) fail("--slug is required");
  if (!password) fail("--password is required");
  if (password.length < 8) fail("--password must be at least 8 characters.");

  const adminPasswordHash = await hashPassword(password);
  const sql = `UPDATE companies SET admin_password_hash = ${sqlString(
    adminPasswordHash
  )} WHERE slug = ${sqlString(slug)};`;

  const target = args.remote ? "--remote" : "--local";
  console.log(`Setting admin password for Company "${slug}" on ${DB_NAME} ${target} ...`);
  executeSql(
    sql,
    args.remote,
    "wrangler d1 execute failed while setting the password."
  );
  console.log(
    `\nDone. If no rows changed, no Company has slug "${slug}" — check the slug.`
  );
}

async function provision(args) {
  const { slug, name, timezone, password } = args;
  if (!slug) fail("--slug is required");
  if (!name) fail("--name is required");
  if (!timezone) fail("--timezone is required");
  if (!password) fail("--password is required");

  if (!SLUG_RE.test(slug)) {
    fail(
      `invalid --slug "${slug}". Use 2-32 chars: lowercase letters, digits, and hyphens; no leading/trailing hyphen.`
    );
  }
  if (!isValidTimezone(timezone)) {
    fail(`invalid --timezone "${timezone}". Use an IANA name like "Asia/Tokyo".`);
  }
  if (password.length < 8) {
    fail("--password must be at least 8 characters.");
  }

  const id = `company_${randomUUID()}`;
  const adminPasswordHash = await hashPassword(password);
  const createdAt = Date.now();

  const sql =
    `INSERT INTO companies (id, slug, name, admin_password_hash, timezone, created_at) VALUES (` +
    [
      sqlString(id),
      sqlString(slug),
      sqlString(name),
      sqlString(adminPasswordHash),
      sqlString(timezone),
      String(createdAt),
    ].join(", ") +
    `);`;

  const target = args.remote ? "--remote" : "--local";
  console.log(
    `Provisioning Company "${name}" (slug: ${slug}, tz: ${timezone}) on ${DB_NAME} ${target} ...`
  );
  executeSql(
    sql,
    args.remote,
    "wrangler d1 execute failed. The slug may already be taken, or migrations may not be applied."
  );

  console.log(`\nDone. Company id: ${id}`);
  console.log(`Reach it at /${slug}/clock and /${slug}/admin once routing ships.`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.setPassword) {
    await setPassword(args);
  } else {
    await provision(args);
  }
}

main().catch((err) => fail(err?.message ?? String(err)));
