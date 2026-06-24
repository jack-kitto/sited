/**
 * Admin-side formatting helpers. Timestamps are rendered in the session
 * Company's timezone (ADR-0004) so the Admin always sees company-local times
 * regardless of where they (or the Worker runtime) are physically located.
 */

import { formatDistance as formatDistanceM } from "@/lib/geo";

/**
 * Human-readable timestamp in the Company's `timeZone`, or an em dash when
 * absent.
 */
export function formatTs(
  ms: number | null | undefined,
  timeZone: string
): string {
  if (ms == null) return "—";
  // en-CA renders as "2026-06-23, 16:30"; normalise the comma out.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(ms)
    .replace(",", "");
}

/** Human-readable distance (meters, switching to km when large), or an em dash. */
export function formatDistance(m: number | null | undefined): string {
  if (m == null) return "—";
  return formatDistanceM(m);
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
