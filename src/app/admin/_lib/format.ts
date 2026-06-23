import { COMPANY_TZ } from "@/lib/time";

/**
 * Admin-side formatting helpers. All calendar/clock formatting happens in
 * COMPANY_TZ so the Admin always sees company-local times regardless of where
 * they (or the Worker runtime) are physically located.
 */

const DISPLAY_FMT = new Intl.DateTimeFormat("en-CA", {
  timeZone: COMPANY_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** Human-readable timestamp in COMPANY_TZ, or an em dash when absent. */
export function formatTs(ms: number | null | undefined): string {
  if (ms == null) return "—";
  // en-CA renders as "2026-06-23, 16:30"; normalise the comma out.
  return DISPLAY_FMT.format(ms).replace(",", "");
}

/** Distance in meters rounded to a whole number, or an em dash when absent. */
export function formatDistance(m: number | null | undefined): string {
  if (m == null) return "—";
  return `${Math.round(m)} m`;
}

/**
 * Worked Hours for a Shift, in milliseconds (see CONTEXT.md):
 * - Complete / Incomplete shifts have a clock-out, so the worked time is
 *   `clockOut - clockIn`, clamped to >= 0 (a late clock-in vs a 16:30
 *   auto-close must never go negative).
 * - Open shifts have no clock-out and therefore no Worked Hours (`null`).
 */
export function workedMs(
  clockInAt: number,
  clockOutAt: number | null | undefined
): number | null {
  if (clockOutAt == null) return null;
  return Math.max(0, clockOutAt - clockInAt);
}

/** Format a duration in ms as `8h 30m`, or an em dash when absent. */
export function formatDuration(ms: number | null | undefined): string {
  if (ms == null) return "—";
  const totalMinutes = Math.round(ms / 60_000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}
