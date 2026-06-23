# Clock-In App

A web app that lets workers clock in and out of fixed job sites by scanning an on-site tag, proving their identity with a PIN, and confirming they are physically present.

## Language

**Company**:
The tenant — an independent customer of Sited. Each Company owns its own Roster, Sites, Shifts, timezone, and Admin access. Data is fully isolated between Companies; one Company must never see another's Workers, Sites, or Shifts. A Worker belongs to exactly one Company and may only clock in at that Company's Sites. New Companies are created by the Platform Operator before a customer can use the app. Each Company has exactly one timezone; all calendar-day logic (Incomplete Shift cutoffs, admin date ranges, exports) follows that timezone regardless of where individual Sites or Workers physically are. A Company's Admin may change its Company Name, admin password, and timezone; the Company Slug is permanent and only the Platform Operator creates a Company.
_Avoid_: Tenant, organization, account, customer (unqualified)

**Platform Operator**:
The person or team who runs Sited and creates new Companies. Distinct from a Company Admin — operates outside any single Company's data boundary.
_Avoid_: Super-admin, system admin, root

**Company Slug**:
The unique public identifier for a Company, set once at provisioning and never changed. Workers and Admins use it to reach their Company's clock and admin flows when they don't have a Site Tag.
_Avoid_: Subdomain, tenant ID, org code

**Company Name**:
The human-readable label for a Company (e.g. "Acme Construction Ltd"). Shown in the UI; editable by that Company's Admin. Distinct from the Company Slug, which is permanent.
_Avoid_: Slug, legal name (unless that's what you mean)

**Worker**:
A person who clocks in and out. Identified by selecting their name from a roster and entering a personal PIN. Two Workers on the same Roster may share a display name; the Admin is responsible for making names distinguishable if needed.
_Avoid_: Employee, user, staff

**Site**:
A fixed job location with known coordinates that workers clock in and out of. Each Site has its own Site Tag. Workers may browse their Company's Sites to get directions before arriving; they never see another Company's Sites.
_Avoid_: Location, place, job

**Site Tag**:
A physical QR code or NFC tag placed at a Site. It encodes the Site's ID and opens the app pointed at that Site; the Company is inferred from the Site, so the Company Slug is not required. The clock flow shows that Site's Company's Roster — a Worker from another Company cannot clock in there.
_Avoid_: QR code, badge, tag (unqualified)

**Roster**:
The admin-maintained list of Workers permitted to clock in at a Company's Sites.
_Avoid_: User list, directory

**Admin**:
A privileged user who manages one Company's Roster and Sites, and who reviews, edits, exports, and resolves that Company's Shifts (including Incomplete ones). Distinct from a Worker. Admins authenticate with their Company's shared admin password — one password per Company, not per person.
_Avoid_: Manager, supervisor, owner

**Shift**:
A single clock-in/clock-out pair for one Worker at one Site. A Worker may have multiple Shifts in a day but must close the current one before starting another. Clock-out must happen at the same Site as clock-in.
_Avoid_: Session, entry, punch

**Open Shift**:
A Shift that has been clocked in but not yet clocked out. A Worker can have at most one Open Shift at a time.
_Avoid_: Active session, pending entry

**Incomplete Shift**:
An Open Shift the Worker never closed. If still open at midnight (the Company's timezone), the system auto-closes it at 16:30 on the shift's own day with no clock-out location and flags it for admin review.
_Avoid_: Abandoned shift, expired shift

**Worked Hours**:
The elapsed time between a Shift's clock-in and clock-out. Complete Shifts contribute their full elapsed time. Incomplete Shifts contribute the time up to their 16:30 auto-close (never negative). Open Shifts have no Worked Hours and are excluded from totals.
_Avoid_: Duration, time worked, hours
