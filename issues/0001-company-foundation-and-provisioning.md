# Company foundation + operator provisioning

**Type:** HITL

## Reference

- ADR: `docs/adr/0004-multi-tenant-companies.md`
- Domain language: `CONTEXT.md` (Company, Company Slug, Company Name, Platform Operator)

## What to build

Establish the **Company** as the tenant entity and the Platform Operator path
for creating one. This is the foundational slice every other multi-tenant slice
builds on.

Add a `companies` table holding the tenant's identity and settings: an id, an
**immutable, unique Company Slug**, a human-readable **Company Name**, a hashed
admin password, and a single **timezone**. Add a `company_id` foreign key to the
tenant-scoped tables (`sites`, `workers`, `shifts`).

Per ADR-0004 this is a **clean break**: rebuild the local D1 schema rather than
migrating existing single-tenant rows. There is no production data to preserve.

Build the **Platform Operator provisioning CLI** (a script under `scripts/`,
talking to D1 directly — no app-level super-admin). It creates a Company from a
slug, display name, timezone, and admin password (hashing the password the same
way the rest of the app does). Decide and document the Slug format/validation
rules (e.g. lowercase, url-safe, uniqueness) as part of this slice.

Update the local dev seed so sites and workers belong to a seeded **demo
Company**, so the rest of the app has a tenant to scope against.

## Acceptance criteria

- [ ] `companies` table exists with id, unique immutable slug, name, hashed admin password, and timezone
- [ ] `sites`, `workers`, and `shifts` carry a `company_id` foreign key to `companies`
- [ ] Local D1 schema is rebuilt clean (no migration of single-tenant rows)
- [ ] A Platform Operator can provision a new Company via a `scripts/` CLI (slug, name, timezone, admin password) writing directly to D1
- [ ] Slug format/validation and uniqueness rules are defined and enforced by the provisioning CLI
- [ ] Provisioning hashes the admin password (no plaintext stored)
- [ ] Local seed creates a demo Company and attaches the seeded sites/workers to it
- [ ] Domain terms used match `CONTEXT.md`

## Blocked by

- None - can start immediately
