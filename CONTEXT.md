# Clock-In App

A web app that lets workers clock in and out of fixed job sites by scanning an on-site tag, proving their identity with a PIN, and confirming they are physically present.

## Language

**Worker**:
A person who clocks in and out. Identified by selecting their name from a roster and entering a personal PIN.
_Avoid_: Employee, user, staff

**Site**:
A fixed job location with known coordinates that workers clock in and out of. Each Site has its own Site Tag.
_Avoid_: Location, place, job

**Site Tag**:
A physical QR code or NFC tag placed at a Site. It encodes the Site's ID and opens the app pointed at that Site.
_Avoid_: QR code, badge, tag (unqualified)

**Roster**:
The admin-maintained list of Workers permitted to clock in.
_Avoid_: User list, directory

**Admin**:
A privileged user who manages the Roster and Sites, and who reviews, edits, exports, and resolves Shifts (including Incomplete ones). Distinct from a Worker.
_Avoid_: Manager, supervisor, owner

**Shift**:
A single clock-in/clock-out pair for one Worker at one Site. A Worker may have multiple Shifts in a day but must close the current one before starting another. Clock-out must happen at the same Site as clock-in.
_Avoid_: Session, entry, punch

**Open Shift**:
A Shift that has been clocked in but not yet clocked out. A Worker can have at most one Open Shift at a time.
_Avoid_: Active session, pending entry

**Incomplete Shift**:
An Open Shift the Worker never closed. If still open at midnight (company timezone), the system auto-closes it at 16:30 on the shift's own day with no clock-out location and flags it for admin review.
_Avoid_: Abandoned shift, expired shift

**Worked Hours**:
The elapsed time between a Shift's clock-in and clock-out. Complete Shifts contribute their full elapsed time. Incomplete Shifts contribute the time up to their 16:30 auto-close (never negative). Open Shifts have no Worked Hours and are excluded from totals.
_Avoid_: Duration, time worked, hours
