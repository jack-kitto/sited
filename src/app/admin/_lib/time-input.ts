/**
 * Conversions between an `<input type="datetime-local">` value (a bare
 * wall-clock string with no timezone) and an epoch-ms instant, interpreting
 * the wall-clock time in the session Company's `timeZone` (ADR-0004).
 *
 * This mirrors the zoned-time math in `@/lib/time` (which keeps those helpers
 * private), so the Admin edits times in company-local terms.
 */

type Parts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function partsInTz(ms: number, timeZone: string): Parts {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const map: Record<string, string> = {};
  for (const p of fmt.formatToParts(ms)) {
    if (p.type !== "literal") map[p.type] = p.value;
  }
  let hour = Number(map.hour);
  if (hour === 24) hour = 0;
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour,
    minute: Number(map.minute),
    second: Number(map.second),
  };
}

function tzOffsetMs(utcMs: number, timeZone: string): number {
  const p = partsInTz(utcMs, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - utcMs;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Epoch ms -> "YYYY-MM-DDTHH:mm" wall-clock string in the Company's `timeZone`. */
export function msToLocalInput(
  ms: number | null | undefined,
  timeZone: string
): string {
  if (ms == null) return "";
  const p = partsInTz(ms, timeZone);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(
    p.minute
  )}`;
}

/** "YYYY-MM-DDTHH:mm" in the Company's `timeZone` -> epoch ms (or null). */
export function localInputToMs(
  value: string | null | undefined,
  timeZone: string
): number | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (!m) return null;
  const [, y, mo, d, h, mi] = m;
  const guess = Date.UTC(
    Number(y),
    Number(mo) - 1,
    Number(d),
    Number(h),
    Number(mi),
    0
  );
  // Two passes settle the offset correctly across any DST boundary.
  let offset = tzOffsetMs(guess, timeZone);
  let result = guess - offset;
  offset = tzOffsetMs(result, timeZone);
  result = guess - offset;
  return result;
}
