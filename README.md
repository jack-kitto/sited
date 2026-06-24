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

One secret is required:

- `SESSION_SECRET` — key used to sign the admin session cookie (HMAC-SHA256).
  Under ADR-0004 the session payload carries the Admin's `companyId`.

Admin passwords are **per Company**, hashed in D1 (ADR-0004) and set via the
provisioning CLI — there is no global `ADMIN_PASSWORD` secret anymore.

**Local:** copy the example and fill it in (this file is gitignored):

```bash
cp .dev.vars.example .dev.vars
```

**Production:** set the secret with Wrangler (never commit secret values):

```bash
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

## Companies (multi-tenant)

Sited serves multiple **Companies** (tenants) from one deployment, isolated at
the row level in D1 (ADR-0004). Companies are **operator-provisioned** — there is
no public signup. Workers and Admins reach a Company by its immutable **Company
Slug** in the URL:

- `/{slug}/clock` — that Company's clock-in flow.
- `/{slug}/admin` — that Company's admin, behind its own password.
- A **Site Tag** (`/clock?site=<siteId>`) needs no slug — the Site implies the
  Company.
- `/`, bare `/clock`, and bare `/admin` are generic: they prompt for a Company
  Slug and forward to the scoped route.

### Provision a Company

Run the Platform Operator CLI (writes a `companies` row directly to D1, default
**local**; Node 22 required for Wrangler):

```bash
npm run provision -- \
  --slug acme \
  --name "Acme Construction Ltd" \
  --timezone Asia/Tokyo \
  --password "a-strong-password"
```

Slug rules (immutable, public): lowercase letters, digits, and hyphens; 2–32
chars; no leading/trailing hyphen; unique across the platform. The admin
password is PBKDF2-SHA256 hashed in the same format the app verifies; an Admin
can later change the Company Name, password, and timezone in
`/{slug}/admin/settings` — the slug is permanent.

### First Company (`wl`) — set its password

The migration backfills existing single-tenant data into a first Company
(slug `wl`) with a **locked** (empty) admin password. The Platform Operator must
set it before that Company's Admin can sign in:

```bash
npm run provision -- --set-password --slug wl --password "a-strong-password"
```

Pass `--remote` to either command to target production D1 instead of local.

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
  app/            # App Router pages (landing, /[slug]/clock, /[slug]/admin, Site-Tag /clock)
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

## PWA / install

The app ships a web manifest ([`src/app/manifest.ts`](./src/app/manifest.ts)).
Because one manifest is shared by every Company, the installed PWA cannot
auto-scope to one, so `start_url` is `/` (the generic landing page): launching
the installed app lands the Worker on the Company Slug entry, and they tap
through to `/{slug}/clock`. A **Site Tag** deep link (`/clock?site=`) still opens
a usable, Company-scoped clock flow directly because it falls within the
manifest `scope` (`/`).
