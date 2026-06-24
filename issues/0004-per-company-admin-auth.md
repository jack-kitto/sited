# Per-Company admin authentication

**Type:** AFK

## Reference

- ADR: `docs/adr/0004-multi-tenant-companies.md` (supersedes ADR-0003's global admin password)
- Domain language: `CONTEXT.md` (Admin, Company, Company Slug)

## What to build

Move admin authentication from a single global password to one shared password
per Company.

Add a slug-scoped admin login (`/{slug}/admin`) that verifies the entered
password against that Company's stored hashed admin password. On success the
admin session token must carry the `companyId` so every downstream admin request
is scoped to one Company. Remove the global `ADMIN_PASSWORD` env secret;
`SESSION_SECRET` stays. A bare `/admin` with no slug prompts for a Company Slug.

This slice delivers the authentication boundary only — scoping the admin data
reads/writes by `companyId` is issue 0005.

## Acceptance criteria

- [ ] `/{slug}/admin` login verifies the password against that Company's hashed admin password
- [ ] A Company's password authenticates only that Company (Company A's password fails for Company B)
- [ ] The admin session token carries `companyId`
- [ ] The global `ADMIN_PASSWORD` secret is removed from code; `SESSION_SECRET` remains
- [ ] Bare `/admin` (no slug) prompts for a Company Slug
- [ ] Admin route guard rejects requests without a valid Company-scoped session

## Blocked by

- 0001 — Company foundation + operator provisioning
