# Per-Company timezone everywhere

**Type:** AFK

## Reference

- ADR: `docs/adr/0004-multi-tenant-companies.md`
- Domain language: `CONTEXT.md` (Company, Incomplete Shift, Worked Hours)

## What to build

Replace the single hardcoded company timezone with each Company's own timezone
for all calendar-day logic.

Today a global `COMPANY_TZ` constant drives the Incomplete Shift midnight
cutoff, the 16:30 auto-close, admin date-range filters, and exports. Each
calculation must instead use the relevant Company's timezone:

- **Admin date filters & exports** use the session Company's timezone.
- **The hourly cron sweep** must join Shifts to Companies and evaluate each Open
  Shift against its own Company's timezone, not one global constant.

## Acceptance criteria

- [ ] `COMPANY_TZ` is no longer used as a global source of truth for calendar logic
- [ ] Admin date-range filters and exports use the session Company's timezone
- [ ] The cron sweep evaluates each Open Shift's midnight cutoff and 16:30 auto-close in its own Company's timezone
- [ ] Two Companies in different timezones each auto-close and filter correctly and independently
- [ ] Worked Hours / Incomplete Shift cutoffs remain correct per Company

## Blocked by

- 0001 — Company foundation + operator provisioning
- 0005 — Company-scoped admin data
