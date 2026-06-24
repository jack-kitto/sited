# Generic landing, slug entry & PWA scoping

**Type:** HITL

## Reference

- ADR: `docs/adr/0004-multi-tenant-companies.md` (PWA `start_url` flagged as needing revisit)
- Domain language: `CONTEXT.md` (Company Slug, Site Tag)

## What to build

Finish the unscoped entry points and the install/onboarding experience for a
multi-tenant world.

`/` stays a **generic landing page** but gains a clear Company Slug entry path
into the clock and admin flows. Revisit the **PWA `start_url`**: bare `/clock`
no longer auto-scopes a Company without a Site Tag or slug, so decide what an
installed PWA should open to and how a Worker scopes to their Company after
launch. Update operator/dev docs to match the new model: drop `ADMIN_PASSWORD`
from `.dev.vars.example`, and update the README / deploy docs for per-Company
provisioning and authentication.

This is HITL because the PWA `start_url` / slug-prompt onboarding UX is left
open in ADR-0004 and needs a design decision before implementation.

## Acceptance criteria

- [ ] `/` is a generic landing page with a working Company Slug entry path into clock and admin
- [ ] PWA `start_url` and post-launch Company scoping behavior are decided and implemented
- [ ] `ADMIN_PASSWORD` is removed from `.dev.vars.example`
- [ ] README / deploy docs describe per-Company provisioning and authentication
- [ ] Installing the PWA and launching it leads a Worker to a usable, Company-scoped clock path

## Blocked by

- 0002 — Slug-scoped clock flow + roster scoping
- 0004 — Per-Company admin authentication
