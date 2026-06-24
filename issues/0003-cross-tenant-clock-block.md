# Site-implied Company + cross-tenant clock block

**Type:** AFK

## Reference

- ADR: `docs/adr/0004-multi-tenant-companies.md`
- Domain language: `CONTEXT.md` (Site Tag, Site, Company, Worker, Shift)

## What to build

Keep Site Tags working without reprinting and make cross-tenant clock-in
impossible.

A Site Tag opens `/clock?site=<siteId>`; the Site implies the Company, so the
clock flow must infer the Company from the Site (no Company Slug required) and
show that Site's Company's Roster. The clock API must reject a punch when the
Worker's Company does not match the Site's Company, returning a clear error
rather than recording the Shift.

This closes the data-isolation guarantee at the actual write path: a punch can
only ever be recorded for a Worker and Site belonging to the same Company.

## Acceptance criteria

- [x] `/clock?site=<id>` resolves the Company from the Site (no slug needed) and shows that Company's Roster
- [x] Existing printed Site Tags continue to work unchanged (no reprint required)
- [x] The clock API rejects a punch when the Worker's Company ≠ the Site's Company
- [x] A rejected cross-tenant punch records no Shift and returns a clear error
- [x] A same-Company punch (clock-in and clock-out) still succeeds end-to-end

## Blocked by

- 0001 — Company foundation + operator provisioning
- 0002 — Slug-scoped clock flow + roster scoping
