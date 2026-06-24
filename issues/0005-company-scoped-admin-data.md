# Company-scoped admin data

**Type:** AFK

## Reference

- ADR: `docs/adr/0004-multi-tenant-companies.md`
- Domain language: `CONTEXT.md` (Admin, Company, Roster, Site, Shift)

## What to build

Scope every admin data operation to the Admin's own Company.

All admin reads (Sites list, Roster/Workers list, Shifts list and summary, CSV
export) must filter by the session's `companyId`. All admin writes (create/edit
Sites, create/edit Workers, edit/resolve Shifts) must read and stamp
`companyId` from the session — never trust a client-supplied company. Direct
access by id to a record belonging to another Company must be refused.

A missed `WHERE company_id = ?` is a data leak (ADR-0004 Consequences), so this
slice is specifically about closing that across every admin endpoint.

## Acceptance criteria

- [ ] Admin Sites, Workers, Shifts, and summary endpoints return only the session Company's rows
- [ ] CSV export contains only the session Company's Shifts
- [ ] Creating a Site or Worker stamps the session's `companyId` (client cannot override it)
- [ ] Editing/resolving a Site, Worker, or Shift by id is refused when it belongs to another Company
- [ ] An Admin for Company A cannot read or mutate any of Company B's data through any admin endpoint

## Blocked by

- 0004 — Per-Company admin authentication
