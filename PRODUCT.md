# Product

## Register

product

## Users

**Workers** — the primary, highest-volume users. They clock in and out at fixed job
sites from their own phone, often outdoors in bright light, one-handed, sometimes
wearing gloves, and not necessarily technical. Their context is "I just arrived /
I'm leaving" — they want the shortest possible path from opening the app to a
confirmed clock-in/out. The app auto-detects the Site from their location (a Site
Tag QR/NFC link is the override), they pick their name from the Roster and enter a
personal PIN, and a hard geofence confirms physical presence.

**Admins** — a smaller group working on desktop. They manage the Roster and Sites,
and review, edit, export, and resolve Shifts (including Incomplete ones auto-closed
at 16:30). Their context is data review and correction, not speed.

## Product Purpose

Sited proves *who* worked *where* and *for how long*, with confidence. It exists to
replace error-prone manual timesheets with a flow that is trivial for workers and
trustworthy for the people paying them. Success looks like: a worker clocks in
correctly in seconds without help, the geofence and PIN keep the record honest, and
an admin can trust the resulting Shift data enough to export it for payroll without
second-guessing it.

## Brand Personality

Utilitarian and trustworthy. Three words: **dependable, legible, unobtrusive.** The
voice is plain and direct, using the domain language from `CONTEXT.md` (Worker,
Site, Shift, Roster) rather than generic UX filler. It should feel like a reliable
tool a crew uses every day — confident and quiet, never flashy, never cute.

## Anti-references

- **Generic purple-gradient SaaS** — hero-metric landing templates, gradient text,
  glassmorphism, "modern startup" decoration with no substance.
- **Cluttered enterprise time-tracking tools** (ADP / Kronos-style density) —
  cramped tables, nested panels, settings sprawl, hostile information overload.
- **Playful / childish consumer cuteness** — mascots, rounded toy aesthetics,
  emoji-driven UI, anything that undercuts the trust the data needs to carry.
- The current **stock shadcn neutral gray** is the starting point to move beyond,
  not a destination — the app needs a real, ownable identity.

## Design Principles

1. **One obvious action per screen.** The worker flow especially should never make
   someone hunt for what to do next; the primary action is unmistakable.
2. **Trust through legibility.** Time, identity, location, and status are the
   product. They must read unambiguously and at high contrast — never decorative,
   never low-contrast-for-elegance.
3. **Built for the field.** Phone-first, one-handed reach, large forgiving touch
   targets, readable in direct sunlight. The clock flow is designed for the worst
   conditions, not the demo.
4. **Respect the worker's time.** Every tap on the clock path earns its place; the
   fastest correct outcome wins over showing more.
5. **Honest, plain language.** Use the glossary, state what's true (on site / off
   site, open / closed / incomplete), and surface errors as plainly as successes.

## Accessibility & Inclusion

- **WCAG AA baseline** across the whole app, with **field-friendly contrast and
  large touch targets** prioritized on the worker clock flow (outdoor light,
  gloves, older and non-technical workers).
- Body text ≥ 4.5:1, large/bold text ≥ 3:1, including placeholders and status text.
- Touch targets comfortably above the 44px minimum on the clock path.
- Dark mode is already wired (`next-themes`); both themes must meet contrast.
- Respect `prefers-reduced-motion` for any motion added.
- Status must never rely on color alone (on/off site, open/incomplete shifts carry
  text/icon, not just hue) — supports color-vision differences.
