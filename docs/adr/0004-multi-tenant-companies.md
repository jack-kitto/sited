# Multi-tenant Companies on shared D1

Sited serves multiple independent **Companies** from one deployment. Each Company is a tenant with its own Roster, Sites, Shifts, timezone, and Admin access. Data is isolated at the row level in the existing D1 database (`company_id` on tenant-scoped tables); we do not provision a separate database per Company.

Companies are **operator-provisioned** (CLI, no public signup in v1). Workers and Admins reach a Company via its immutable **Company Slug** in the URL (`/{slug}/clock`, `/{slug}/admin`). **Site Tags** keep working as `/clock?site=<siteId>` — the Site implies the Company, so printed tags do not need reprinting. Bare `/clock` and `/admin` (no slug) prompt for a Company Slug; `/` stays a generic landing page.

**Admin authentication** is a shared password per Company (hashed on the Company record), extending ADR-0003's lightweight posture. The global `ADMIN_PASSWORD` env secret is removed; `SESSION_SECRET` stays and admin session tokens carry `companyId`. **Platform Operator** tooling talks to D1 directly — no app-level super-admin in v1.

Each Company has one **timezone** for all calendar logic (Incomplete Shift midnight cutoff, 16:30 auto-close, admin date filters, exports). The hourly cron sweep must evaluate Open Shifts against each Shift's Company timezone, not a single global constant.

**Cross-tenant clock-in** is blocked: the clock flow shows the resolved Site's Company's Roster, and the API rejects a punch when the Worker's Company does not match the Site's Company.

Multi-tenant ships as a **clean break** — no migration of existing single-tenant rows. Local dev uses a seeded demo Company.

Domain terms: `CONTEXT.md`.

## Considered Options

- **Separate D1 database per Company** — strongest isolation, but multiplies migrations, provisioning, and cron wiring with every customer; poor fit for operator-provisioned v1 scale.
- **Shared D1, row-level isolation (chosen)** — one migration path, one cron, isolation enforced in application code on every query and at clock-in.
- **Subdomain routing (`acme.sited.app`)** — clean branding, but adds DNS/wildcard complexity; path slugs are enough for v1.
- **Self-service signup** — faster onboarding, but needs slug validation, abuse handling, and billing hooks we do not need yet.
- **Per-Admin accounts** — better audit trail, but conflicts with ADR-0003's friction budget; deferred until auditability is a real requirement.
- **Migrate existing single-tenant data into a first Company** — preserves production rows, but we have no production data to preserve; a clean break is simpler.

## Consequences

- Every tenant-scoped query must filter by `companyId` (admin session, Site lookup, Roster, exports, cron sweep). A missed `WHERE` is a data leak.
- ADR-0003's global admin password is superseded; each Company has its own hashed admin password. Per-Admin accounts remain future work.
- `ADMIN_PASSWORD` is removed from env/secrets; `SESSION_SECRET` remains. `.dev.vars.example` and deploy docs must be updated when implemented.
- The Incomplete Shift cron in `custom-worker.ts` must join Shifts to Companies and use each Company's timezone instead of a hardcoded `COMPANY_TZ`.
- Company Slug is immutable; display name, admin password, and timezone are Admin self-service. Duplicate Worker names on a Roster are allowed — the Admin disambiguates in the name field.
- PWA `start_url` (`/clock`) must be revisited — bare `/clock` no longer auto-scopes a Company without a Site Tag or slug prompt.
