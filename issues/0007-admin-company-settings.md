# Admin self-service Company settings

**Type:** AFK

## Reference

- ADR: `docs/adr/0004-multi-tenant-companies.md`
- Domain language: `CONTEXT.md` (Admin, Company Name, Company Slug)

## What to build

Let a Company's Admin manage the parts of their Company that are theirs to
change, while keeping the slug permanent.

Add an admin settings flow where the Admin can edit the **Company Name**, the
**admin password**, and the **timezone**. The **Company Slug is immutable** and
must not be editable. Changes apply to that Company only and take effect for the
relevant behavior (e.g. a new timezone changes that Company's calendar logic; a
new password is required on the next login).

## Acceptance criteria

- [ ] Admin can change the Company Name and it updates in the UI
- [ ] Admin can change the admin password; the new password is required on next login and stored hashed
- [ ] Admin can change the timezone and it drives that Company's calendar logic going forward
- [ ] The Company Slug is displayed but cannot be edited
- [ ] Settings changes are scoped to the session's Company only

## Blocked by

- 0004 — Per-Company admin authentication
- 0006 — Per-Company timezone everywhere
