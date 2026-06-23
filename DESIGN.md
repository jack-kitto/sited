---
name: Sited
description: A dependable, field-ready clock-in tool — steel-blue identity on a flat, high-contrast neutral surface.
colors:
  brand-steel: "oklch(0.46 0.12 248)"
  brand-steel-deep: "oklch(0.40 0.12 248)"
  brand-steel-bright: "oklch(0.60 0.14 248)"
  ink: "oklch(0.20 0.012 248)"
  muted-ink: "oklch(0.48 0.015 248)"
  bg: "oklch(1 0 0)"
  surface: "oklch(0.975 0.004 248)"
  line: "oklch(0.90 0.006 248)"
  ring: "oklch(0.55 0.13 248)"
  on-site: "oklch(0.55 0.13 150)"
  off-site: "oklch(0.55 0.20 27)"
  incomplete: "oklch(0.78 0.13 75)"
  incomplete-surface: "oklch(0.93 0.08 80)"
  incomplete-ink: "oklch(0.42 0.09 70)"
typography:
  display:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.875rem, 4vw, 3rem)"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.35
    letterSpacing: "normal"
  body:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "normal"
  data:
    fontFamily: "Geist Mono, ui-monospace, SFMono-Regular, monospace"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "normal"
    fontFeature: "tnum"
rounded:
  sm: "0.375rem"
  md: "0.5rem"
  lg: "0.625rem"
  xl: "0.875rem"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.brand-steel}"
    textColor: "{colors.bg}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: "0 10px"
    height: "32px"
  button-primary-hover:
    backgroundColor: "{colors.brand-steel-deep}"
    textColor: "{colors.bg}"
  button-field:
    backgroundColor: "{colors.brand-steel}"
    textColor: "{colors.bg}"
    rounded: "{rounded.lg}"
    height: "56px"
    width: "100%"
  button-outline:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    height: "32px"
  button-ghost:
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    height: "32px"
  input:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "0 10px"
    height: "32px"
  card:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "16px"
  badge-onsite:
    backgroundColor: "{colors.on-site}"
    textColor: "{colors.bg}"
    rounded: "{rounded.md}"
  badge-offsite:
    backgroundColor: "{colors.off-site}"
    textColor: "{colors.bg}"
    rounded: "{rounded.md}"
  badge-incomplete:
    backgroundColor: "{colors.incomplete-surface}"
    textColor: "{colors.incomplete-ink}"
    rounded: "{rounded.md}"
---

# Design System: Sited

## 1. Overview

**Creative North Star: "The Site Office"**

Sited should feel like the clipboard bolted to the trailer wall — the one
dependable instrument a crew trusts to record who worked, where, and for how
long. The whole system is built around a single steel-blue brand color sitting
on a flat, high-contrast neutral surface. The blue is **utility infrastructure
blue**, not startup cobalt: deep and slightly desaturated, the color of a
blueprint line or a powder-coated tool, never a glowing SaaS gradient. It does
the brand's emotional work so the surfaces don't have to — backgrounds stay pure
white (near-black in dark mode), text stays close to black, and nothing is tinted
"for warmth."

The system is **legibility-first**. This is a tool people use one-handed, outdoors,
in direct sun, sometimes wearing gloves — so contrast is generous, type is plain,
and the data that matters (times, durations, PINs) is set in a tabular monospace
so digits never wobble. The worker clock flow and the admin dashboard share one
language but two densities: the clock flow uses oversized, full-width targets;
the admin desktop uses the compact controls in this spec.

It explicitly rejects three things, carried straight from the brand's
anti-references: the **generic purple-gradient SaaS template** (hero-metric blocks,
gradient text, glassmorphism); the **cluttered enterprise time-tracker** (ADP /
Kronos density, hostile tables, settings sprawl); and **playful consumer cuteness**
(mascots, toy rounding, emoji-driven UI). It also rejects the anonymous stock
shadcn gray it started from — this system has one committed color and means it.

**Key Characteristics:**
- One brand hue (steel blue), reserved for action and active state — never decoration.
- Pure-white surfaces; the color and type carry the mood, not the background.
- Flat by default: hairline rings, not shadows, separate surfaces.
- Field-grade contrast and touch targets on the worker flow.
- Monospace tabular figures for every time, duration, and PIN.

## 2. Colors

A near-monochrome neutral canvas carrying a single deep steel-blue brand hue, with
three functional status colors held strictly for shift state.

### Primary
- **Steel Blue** (`oklch(0.46 0.12 248)`): The one brand color. Fills primary
  buttons (clock in / out, primary admin actions), marks the active/selected state
  in nav and tabs, and tints focus rings. Always carries white text. In dark mode
  it brightens to **Steel Blue Bright** (`oklch(0.60 0.14 248)`).
- **Steel Blue Deep** (`oklch(0.40 0.12 248)`): Hover/active depth for primary
  surfaces. Never used as a fill on its own.

### Neutral
- **Ink** (`oklch(0.20 0.012 248)`): Body and heading text. A hair of cool keeps it
  in the steel family. ~14:1 on white.
- **Muted Ink** (`oklch(0.48 0.015 248)`): Secondary text, descriptions,
  placeholders. Deliberately darker than stock shadcn's `0.556` to clear 4.5:1 in
  daylight — placeholders included.
- **Background** (`oklch(1 0 0)`): Pure white. App and card surface. No hidden warmth.
- **Surface** (`oklch(0.975 0.004 248)`): Faintly cool panel fill for sections,
  table headers, footers — the only "off-white" allowed.
- **Line** (`oklch(0.90 0.006 248)`): Borders, input strokes, hairline rings.

### Tertiary (functional status — not brand accents)
- **On Site / Complete** (`oklch(0.55 0.13 150)`): Green. Confirmed presence,
  successful clock-in/out, complete shifts. White text on fill.
- **Off Site / Error** (`oklch(0.55 0.20 27)`): Red. Geofence failure, off-site,
  destructive confirmation. White text on fill.
- **Incomplete** (`oklch(0.78 0.13 75)` → surface `oklch(0.93 0.08 80)`, text
  `oklch(0.42 0.09 70)`): Amber, used as a soft pill, for auto-closed Incomplete
  Shifts flagged for admin review.

### Named Rules
**The One Blue Rule.** Steel blue is the *only* brand hue. It appears on primary
actions and active state and nowhere decorative. Green, red, and amber are reserved
exclusively for shift status — never borrow them for emphasis, and never introduce a
second brand accent.

**The Status-Never-Color-Alone Rule.** On site / off site and open / complete /
incomplete must always pair the color with a text label and an icon. Color is the
fastest read, never the only one — this is non-negotiable for sunlight and
color-vision differences.

## 3. Typography

**Display Font:** Geist (with ui-sans-serif, system-ui fallback)
**Body Font:** Geist (same family, lighter weights)
**Label/Mono Font:** Geist Mono (with ui-monospace fallback)

**Character:** Geist is a neutral, slightly technical grotesque — engineered, not
decorative, which is exactly the register a trustworthy tool wants. One family in
multiple weights carries the whole UI; the monospace companion handles data.

### Hierarchy
- **Display** (600, `clamp(1.875rem, 4vw, 3rem)`, 1.05, tracking -0.02em): Landing
  hero and the worker's current state ("You're on site"). Capped well under the
  6rem ceiling; this is a tool, not a billboard.
- **Headline** (600, 1.5rem / 24px, 1.15): Page and major section titles in admin.
- **Title** (500, 1rem / 16px, 1.35): Card titles, dialog titles, group headers.
- **Body** (400, 0.875rem / 14px, 1.5): Default UI and prose. Cap prose at 65–75ch.
- **Label** (500, 0.8125rem / 13px): Form labels, badges, table headers. Sentence
  case — not all-caps tracked eyebrows.
- **Data** (Geist Mono, 500, tabular figures): Times, durations, Worked Hours, PINs.

### Named Rules
**The Tabular Truth Rule.** Every time, duration, Worked-Hours total, and PIN renders
in Geist Mono with `font-feature-settings: "tnum"`. Numbers in a payroll-bound tool
must align in columns and never shift width as digits change.

## 4. Elevation

The system is **flat by default**. Surfaces sit on the same plane and are separated
by a 1px ring (`ring-foreground/10`) rather than shadow — cards are bordered, not
floating. Depth is reserved for things that genuinely leave the page: menus, dialogs,
selects, and toasts. This keeps the dense admin views calm and the worker flow honest
about what's a surface versus what's a layer.

### Shadow Vocabulary (overlays only)
- **Overlay** (`box-shadow: 0 8px 24px oklch(0.20 0.012 248 / 0.16)`): Dropdowns,
  selects, popovers, dialogs, toasts — anything floating above the page.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat and ring-bordered at rest. A shadow
is a signal that an element floats above the page; if it isn't floating, it gets a
ring, not a shadow. No decorative drop shadows on cards or sections.

## 5. Components

### Buttons
- **Shape:** Gently squared (10px radius, `rounded-lg` = `{rounded.lg}`).
- **Primary:** Steel-blue fill, white text, `font-medium`, compact `32px` height
  (`h-8`), `0 10px` padding. The default admin-density action.
- **Hover / Focus:** Hover deepens to Steel Blue Deep. Focus shows a 3px steel ring
  (`ring-ring/50`) plus a solid ring border. Active nudges down 1px (`translate-y-px`).
- **Field (worker clock action):** Same steel fill, but `56px`+ tall and full-width.
  This is the variant the clock flow uses — see The Field-Target Rule.
- **Outline / Ghost:** White (or transparent) with ink text; hover fills with
  `surface`/`muted`. For secondary and tertiary actions.
- **Destructive:** Tinted, not solid red — `off-site/10` background with `off-site`
  text — so destructive reads as caution, reserving solid red for true status fills.

### Cards / Containers
- **Corner Style:** Soft (14px, `rounded-xl` = `{rounded.xl}`).
- **Background:** Pure white (`bg`); footers use `surface`.
- **Shadow Strategy:** None — a 1px ring (`ring-foreground/10`). See Elevation.
- **Internal Padding:** 16px (`--card-spacing`), 12px in the small variant.

### Inputs / Fields
- **Style:** 1px `line` stroke, transparent/white fill, 10px radius, `32px` height.
- **Focus:** Border shifts to steel `ring` + a 3px steel ring glow. No layout shift.
- **Error:** `aria-invalid` shows a red (`off-site`) border + ring.
- **Field density:** PIN entry and roster selection on the worker flow use the
  oversized field sizing, not the compact `32px` default.

### Navigation
- Admin top nav: ink labels, `surface` on hover, steel-blue text + underline or fill
  for the active route. Sentence case, `label` type.

### Badges (shift status)
- **On Site / Complete:** solid green fill, white text, paired with a check/pin icon.
- **Off Site / Error:** solid red fill, white text, paired with an alert icon.
- **Incomplete:** soft amber pill (`incomplete-surface` bg, `incomplete-ink` text),
  paired with a clock/flag icon.

### Named Rules
**The Field-Target Rule.** On the worker clock flow, primary actions and inputs are
≥56px tall and full-width. The compact `32px` controls in this spec are for the admin
desktop only. A worker in gloves in the sun should never hunt for a small target.

## 6. Do's and Don'ts

### Do:
- **Do** keep steel blue as the single brand hue — primary actions and active state
  only (The One Blue Rule).
- **Do** keep backgrounds pure white / near-black; let the blue and type carry the mood.
- **Do** set all times, durations, and PINs in Geist Mono with tabular figures.
- **Do** separate surfaces with a 1px ring; reserve shadow for true overlays.
- **Do** use ≥56px full-width targets on the worker clock flow.
- **Do** pair every status color with a text label and an icon.
- **Do** keep Muted Ink at `oklch(0.48 …)` or darker so secondary text clears 4.5:1.

### Don't:
- **Don't** build the generic purple-gradient SaaS look — no gradient text, no
  glassmorphism, no hero-metric template.
- **Don't** drift toward cluttered enterprise time-tracker density (ADP / Kronos):
  no hostile tables, nested panels, or settings sprawl.
- **Don't** add playful or childish cuteness — no mascots, toy rounding, or emoji UI.
- **Don't** fall back to anonymous stock shadcn gray; this system has a committed color.
- **Don't** brighten the brand into cobalt SaaS-blue — keep it deep and steel
  (chroma ≤ ~0.14, the desaturated utility register).
- **Don't** convey shift status with color alone.
- **Don't** use the compact `32px` controls for the primary worker clock actions.
- **Don't** use `border-left`/`border-right` color stripes as accents on cards or alerts.
