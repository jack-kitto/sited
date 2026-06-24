# Multi-tenant Companies on shared D1

Sited serves multiple independent **Companies** from one deployment. Each Company is a tenant with its own Roster, Sites, Shifts, timezone, and Admin access. Data is isolated at the row level in the existing D1 database (`company_id` on tenant-scoped tables); we do not provision a separate database per Company.

Companies are **operator-provisioned** (CLI, no public signup in v1). Workers and Admins reach a Company via its immutable **Company Slug** in the URL (`/{slug}/clock`, `/{slug}/admin`). **Site Tags** keep working as `/clock?site=<siteId>` — the Site implies the Company, so printed tags do not need reprinting. Bare `/clock` and `/admin` (no slug) prompt for a Company Slug; `/` stays a generic landing page.

**Admin authentication** is a shared password per Company (hashed on the Company record), extending ADR-0003's lightweight posture. The global `ADMIN_PASSWORD` env secret is removed; `SESSION_SECRET` stays and admin session tokens carry `companyId`. **Platform Operator** tooling talks to D1 directly — no app-level super-admin in v1.

Each Company has one **timezone** for all calendar logic (Incomplete Shift midnight cutoff, 16:30 auto-close, admin date filters, exports). The hourly cron sweep must evaluate Open Shifts against each Shift's Company timezone, not a single global constant.

**Cross-tenant clock-in** is blocked: the clock flow shows the resolved Site's Company's Roster, and the API rejects a punch when the Worker's Company does not match the Site's Company.

Multi-tenant ships as a **data-preserving backfill**, not a clean break: existing single-tenant rows are kept and adopted into one first Company (slug `wl`) by the migration, which adds `company_id` to each tenant table and backfills it. The first Company is created with a **locked admin password** (empty hash) that the Platform Operator sets after migrating (`npm run provision -- --set-password --slug wl …`). Local dev additionally uses a seeded `demo` Company.

Domain terms: `CONTEXT.md`.

## Considered Options

- **Separate D1 database per Company** — strongest isolation, but multiplies migrations, provisioning, and cron wiring with every customer; poor fit for operator-provisioned v1 scale.
- **Shared D1, row-level isolation (chosen)** — one migration path, one cron, isolation enforced in application code on every query and at clock-in.
- **Subdomain routing (`acme.sited.app`)** — clean branding, but adds DNS/wildcard complexity; path slugs are enough for v1.
- **Self-service signup** — faster onboarding, but needs slug validation, abuse handling, and billing hooks we do not need yet.
- **Per-Admin accounts** — better audit trail, but conflicts with ADR-0003's friction budget; deferred until auditability is a real requirement.
- **Backfill existing single-tenant data into a first Company (chosen)** — preserves the real production Roster, Sites, and Shifts already in the live D1 by adopting them into the first Company. Costs one extra migration and an operator step to set that Company's password.
- **Clean break, dropping existing rows** — simpler migration, but there *is* real production data (the first customer has already entered Workers, Sites, and Shifts), so wiping it is unacceptable.

## Consequences

- Every tenant-scoped query must filter by `companyId` (admin session, Site lookup, Roster, exports, cron sweep). A missed `WHERE` is a data leak.
- `company_id` is added with `ALTER TABLE … ADD COLUMN … NOT NULL DEFAULT 'company_wl'` rather than a table rebuild: D1 enforces foreign keys on `DROP TABLE` and ignores `PRAGMA foreign_keys`/`defer_foreign_keys` inside its migration transaction, so the usual SQLite create/copy/drop/rename rebuild fails. Consequently no DB-level FK is created on `company_id`; tenant isolation is enforced in application code (as above), and Drizzle's NOT-NULL (no default) typing forces app inserts to pass `company_id` explicitly so the column default is only ever the migration backfill value.
- ADR-0003's global admin password is superseded; each Company has its own hashed admin password. Per-Admin accounts remain future work.
- `ADMIN_PASSWORD` is removed from env/secrets; `SESSION_SECRET` remains. `.dev.vars.example` and deploy docs must be updated when implemented.
- The Incomplete Shift cron in `custom-worker.ts` must join Shifts to Companies and use each Company's timezone instead of a hardcoded `COMPANY_TZ`.
- Company Slug is immutable; display name, admin password, and timezone are Admin self-service. Duplicate Worker names on a Roster are allowed — the Admin disambiguates in the name field.
- PWA `start_url` is `/` (issue 0008): one manifest is shared by every Company, so the installed PWA cannot auto-scope to one. Launch lands on the generic landing page, where a Worker enters their Company Slug and is routed to `/{slug}/clock`; the bare `/clock` and `/admin` prompts do the same. Site Tag deep links (`/clock?site=`) still open a usable, Company-scoped clock flow because they fall within the manifest `scope` (`/`). (Per-Company installs would need per-Company manifests/subdomains — deferred with subdomain routing.)
