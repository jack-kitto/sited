# Slug-scoped clock flow + roster scoping

**Type:** AFK

## Reference

- ADR: `docs/adr/0004-multi-tenant-companies.md`
- Domain language: `CONTEXT.md` (Company Slug, Roster, Worker, Site)

## What to build

Let a Worker reach their Company's clock flow by its Company Slug and see only
that Company's Roster and Sites.

Add a slug-scoped clock route (`/{slug}/clock`) that resolves the Company from
the slug and renders the clock flow scoped to it. The roster endpoint and the
nearest-Site resolution must return only the resolved Company's active Workers
and Sites — never another Company's. A bare `/clock` with no slug and no Site
Tag prompts the Worker for their Company Slug (a real entry path, even if
minimal).

This slice is the end-to-end "a Worker on Company A's clock page only ever sees
Company A" path. Cross-tenant punch enforcement and Site-Tag company inference
are handled in issue 0003.

## Acceptance criteria

- [x] `/{slug}/clock` resolves the Company by slug and shows that Company's Roster
- [x] An unknown/invalid slug is handled gracefully (not a crash or another Company's data)
- [x] The roster endpoint returns only the resolved Company's active Workers
- [x] Nearest-Site resolution considers only the resolved Company's Sites
- [x] Bare `/clock` (no slug, no Site Tag) prompts for a Company Slug
- [x] No endpoint in this flow leaks Workers or Sites across Companies

## Blocked by

- 0001 — Company foundation + operator provisioning
