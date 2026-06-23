# Sited

Workers clock in and out of fixed **Sites**. The clock page picks the Site from
the worker's **location** automatically (a **Site Tag** QR/NFC link to
`/clock?site=<siteId>` still works as an override), then they pick their name
from the **Roster** and enter a personal **PIN**. A hard geofence (default 100m,
ADR-0002) requires the worker to be on site for both clock-in and clock-out.
An **Admin** manages each **Company** (ADR-0004) behind that Company's shared
password.

See [`CONTEXT.md`](./CONTEXT.md) for the glossary and [`docs/adr`](./docs/adr)
for the architecture decisions.

## Tech stack

- **Next.js 16** (App Router, TypeScript, `src/`) + **Tailwind CSS v4** + **shadcn/ui**.
- Deployed to **Cloudflare Workers** via **OpenNext** (`@opennextjs/cloudflare`).
- **Cloudflare D1** (SQLite) via **Drizzle ORM** + **drizzle-kit**.
- **Web Crypto** (PBKDF2-SHA256) for PIN hashing — runs in the Workers runtime.

## Prerequisites

- **Node.js 22+** (required by Wrangler 4). Node 20 will work for `next build`
  and `tsc`, but `wrangler` / OpenNext commands require Node 22.
- npm.

## Install

```bash
npm install
```

## Cloudflare types

The `CloudflareEnv` type (D1 `DB`, secrets, etc.) is generated from
`wrangler.jsonc` + `.dev.vars`:

```bash
npm run cf-typegen   # writes cloudflare-env.d.ts
```

Re-run this whenever you change `wrangler.jsonc` or add a binding/secret.

## Secrets

Two secrets are required today:

- `ADMIN_PASSWORD` — the single shared admin password (ADR-0003; **removed when ADR-0004 lands** — each Company will have its own hashed admin password in D1).
- `SESSION_SECRET` — key used to sign the admin session cookie (HMAC-SHA256); retained under ADR-0004, with `companyId` in the session payload.

**Local:** copy the example and fill it in (this file is gitignored):

```bash
cp .dev.vars.example .dev.vars
```

**Production:** set them with Wrangler (never commit secret values):

```bash
wrangler secret put ADMIN_PASSWORD
wrangler secret put SESSION_SECRET
```

## Local database (D1)

Migrations live in [`migrations/`](./migrations) and are generated from
[`src/db/schema.ts`](./src/db/schema.ts) by drizzle-kit.

```bash
# 1. (after schema changes) regenerate migration SQL
npm run db:generate

# 2. apply migrations to the local D1 (offline, no Cloudflare auth needed)
npm run db:migrate:local

# 3. seed sample Sites + Workers
npm run seed:local
```

Seeded workers and their **local-only** PINs:

| Worker | PIN  |
| ------ | ---- |
| Alice  | 1234 |
| Bob    | 5678 |
| Carol  | 4321 |

PINs are PBKDF2-SHA256 hashed (see [`src/lib/pin.ts`](./src/lib/pin.ts)); the
seed embeds precomputed hashes. Regenerate them with:

```bash
node scripts/hash-pin.mjs 1234 5678 4321
```

### Creating the remote D1 database

`wrangler.jsonc` uses a placeholder `database_id`. Before deploying, create the
real database and update the id:

```bash
wrangler d1 create sited-db        # copy the printed database_id into wrangler.jsonc
npm run db:migrate:remote                 # apply migrations to remote
```

## Develop

```bash
npm run dev          # Next.js dev server (Cloudflare bindings available via OpenNext)
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
```

## Preview & deploy (Cloudflare)

```bash
npm run preview      # build with OpenNext and run locally in the Workers runtime
npm run deploy       # build and deploy to Cloudflare Workers
npm run upload       # build and upload a new version without deploying
```

## Project layout

```
src/
  app/            # App Router pages (landing, /clock, /admin stubs)
  components/ui/  # shadcn/ui components
  db/             # Drizzle schema, client (getDb), seed.sql
  lib/            # shared libs: geo, pin, auth, time, ids, types
custom-worker.ts  # Worker entry: OpenNext fetch handler + hourly scheduled stub
wrangler.jsonc    # Cloudflare config (D1 binding "DB", cron trigger)
open-next.config.ts
drizzle.config.ts
migrations/       # D1 migrations (also drizzle-kit output dir)
scripts/          # hash-pin.mjs, seed-local.sh
```

## Notes / TODO for feature agents

- The `/clock` and `/admin` pages are **stubs**; the data layer, shared libs,
  schema, and config are the foundation.
- The hourly cron (`custom-worker.ts` `scheduled`) is wired but empty — it
  should sweep Open Shifts past midnight and auto-close them as Incomplete
  (see [`src/lib/time.ts`](./src/lib/time.ts)).
