# Issues

Local markdown issue tracker. One file per issue, named `NNNN-short-slug.md`.

## Multi-tenant Companies (ADR-0004)

Vertical tracer-bullet slices for adding multi-tenancy to Sited. See
`docs/adr/0004-multi-tenant-companies.md` and `CONTEXT.md` for domain language.

| # | Issue | Type | Blocked by |
| --- | --- | --- | --- |
| 0001 | [Company foundation + operator provisioning](0001-company-foundation-and-provisioning.md) | HITL | — |
| 0002 | [Slug-scoped clock flow + roster scoping](0002-slug-scoped-clock-flow.md) | AFK | 0001 |
| 0003 | [Site-implied Company + cross-tenant clock block](0003-cross-tenant-clock-block.md) | AFK | 0001, 0002 |
| 0004 | [Per-Company admin authentication](0004-per-company-admin-auth.md) | AFK | 0001 |
| 0005 | [Company-scoped admin data](0005-company-scoped-admin-data.md) | AFK | 0004 |
| 0006 | [Per-Company timezone everywhere](0006-per-company-timezone.md) | AFK | 0001, 0005 |
| 0007 | [Admin self-service Company settings](0007-admin-company-settings.md) | AFK | 0004, 0006 |
| 0008 | [Generic landing, slug entry & PWA scoping](0008-landing-slug-entry-pwa.md) | HITL | 0002, 0004 |
