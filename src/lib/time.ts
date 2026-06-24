/**
 * Calendar-day time helpers (ADR-0004: per-Company timezone).
 *
 * Each Company has its own IANA timezone, so every calendar-day and auto-close
 * calculation takes an explicit `timeZone` argument — there is no single global
 * source of truth for calendar math. Callers thread the relevant Company's
 * `timezone` (the admin session Company, or each Shift's Company in the cron
 * sweep). We use Intl.DateTimeFormat for timezone math to avoid extra deps.
 */

/**
 * Display-only fallback timezone for flows that have no resolved Company yet
 * (e.g. the bare clock UI before the Site lookup returns). This MUST NOT drive
 * any per-Company calendar math — those paths always pass an explicit timezone.
 */
export const COMPANY_TZ = "Asia/Tokyo";

/** Hour/minute an Incomplete Shift is auto-closed at, on its own day. */
const AUTO_CLOSE_HOUR = 16;
const AUTO_CLOSE_MINUTE = 30;

/** Current time in epoch milliseconds. */
export function nowMs(): number {
  return Date.now();
}

type CalendarParts = {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  hour: number;
  minute: number;
  second: number;
};

/** Break an instant into its wall-clock parts in a given timezone. */
function partsInTz(ms: number, timeZone: string): CalendarParts {
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
  if (hour === 24) hour = 0; // some engines emit "24" for midnight
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour,
    minute: Number(map.minute),
    second: Number(map.second),
  };
}

/** Offset (ms) such that utcMs + offset = wall-clock-as-if-UTC, for a tz. */
function tzOffsetMs(utcMs: number, timeZone: string): number {
  const p = partsInTz(utcMs, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - utcMs;
}

/** Convert a wall-clock time in `timeZone` to an epoch-ms instant. */
function zonedWallTimeToMs(
  year: number,
  month: number, // 1-12
  day: number,
  hour: number,
  minute: number,
  timeZone: string
): number {
  const guess = Date.UTC(year, month - 1, day, hour, minute, 0);
  // Two passes handle DST transitions correctly for any timezone.
  let offset = tzOffsetMs(guess, timeZone);
  let result = guess - offset;
  offset = tzOffsetMs(result, timeZone);
  result = guess - offset;
  return result;
}

/**
 * The auto-close instant for a Shift that clocked in at `clockInMs`: 16:30 on
 * that shift's OWN calendar day in the Company's `timeZone`, returned as epoch
 * ms.
 */
export function autoCloseAtFor(clockInMs: number, timeZone: string): number {
  const { year, month, day } = partsInTz(clockInMs, timeZone);
  return zonedWallTimeToMs(
    year,
    month,
    day,
    AUTO_CLOSE_HOUR,
    AUTO_CLOSE_MINUTE,
    timeZone
  );
}

/** Comparable integer for a calendar day, e.g. 2026-06-23 -> 20260623. */
function dayOrdinal(ms: number, timeZone: string): number {
  const { year, month, day } = partsInTz(ms, timeZone);
  return year * 10000 + month * 100 + day;
}

/**
 * True if `now` falls on a later calendar day (in the Company's `timeZone`) than
 * `openedMs` (i.e. the Open Shift has crossed midnight and is now Incomplete).
 */
export function isPastMidnight(
  openedMs: number,
  now: number,
  timeZone: string
): boolean {
  return dayOrdinal(now, timeZone) > dayOrdinal(openedMs, timeZone);
}

// ---------------------------------------------------------------------------
// Calendar-date helpers (in a Company's timezone).
//
// Used by the Admin date-range filtering. A "company date" is a plain
// year/month/day in the Company's timezone, serialized as an ISO `YYYY-MM-DD`
// string in the URL. The conversions below stay correct across DST regardless
// of the timezone passed.
// ---------------------------------------------------------------------------

export type CompanyDate = { year: number; month: number; day: number };

/** The calendar date an instant falls on, in the Company's `timeZone`. */
export function companyDateOf(ms: number, timeZone: string): CompanyDate {
  const p = partsInTz(ms, timeZone);
  return { year: p.year, month: p.month, day: p.day };
}

/** Epoch ms for 00:00 (in the Company's `timeZone`) on the given date. */
export function startOfCompanyDayMs(d: CompanyDate, timeZone: string): number {
  return zonedWallTimeToMs(d.year, d.month, d.day, 0, 0, timeZone);
}

/** Serialize a company date as `YYYY-MM-DD`. */
export function formatCompanyDate(d: CompanyDate): string {
  const mm = String(d.month).padStart(2, "0");
  const dd = String(d.day).padStart(2, "0");
  return `${d.year}-${mm}-${dd}`;
}

/** Parse a `YYYY-MM-DD` string into a company date, or null if malformed. */
export function parseCompanyDate(s: string): CompanyDate | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
}

/** Add `n` calendar days to a company date (n may be negative). */
export function addCompanyDays(d: CompanyDate, n: number): CompanyDate {
  // Day-of-month arithmetic via the UTC calendar (no tz/DST involved here).
  const shifted = new Date(Date.UTC(d.year, d.month - 1, d.day) + n * 86_400_000);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

export type DateRangePreset = "today" | "this_week" | "this_month" | "last_month";

/** Inclusive `YYYY-MM-DD` date range (both ends are real days the user picks). */
export type DateRangeStrings = { from: string; to: string };

/** Day of week (0=Sun..6=Sat) for a company date. */
function weekday(d: CompanyDate): number {
  return new Date(Date.UTC(d.year, d.month - 1, d.day)).getUTCDay();
}

/** Resolve a named preset to an inclusive company-date range in `timeZone`. */
export function presetRange(
  preset: DateRangePreset,
  timeZone: string,
  now: number = Date.now()
): DateRangeStrings {
  const today = companyDateOf(now, timeZone);

  if (preset === "today") {
    const s = formatCompanyDate(today);
    return { from: s, to: s };
  }

  if (preset === "this_week") {
    // Week runs Monday..Sunday.
    const mondayOffset = (weekday(today) + 6) % 7;
    const monday = addCompanyDays(today, -mondayOffset);
    const sunday = addCompanyDays(monday, 6);
    return { from: formatCompanyDate(monday), to: formatCompanyDate(sunday) };
  }

  if (preset === "this_month") {
    const first: CompanyDate = { year: today.year, month: today.month, day: 1 };
    const lastDay = new Date(Date.UTC(today.year, today.month, 0)).getUTCDate();
    const last: CompanyDate = { year: today.year, month: today.month, day: lastDay };
    return { from: formatCompanyDate(first), to: formatCompanyDate(last) };
  }

  // last_month: day 0 of this month == last day of previous month.
  const lastOfPrev = addCompanyDays(
    { year: today.year, month: today.month, day: 1 },
    -1
  );
  const first: CompanyDate = {
    year: lastOfPrev.year,
    month: lastOfPrev.month,
    day: 1,
  };
  return { from: formatCompanyDate(first), to: formatCompanyDate(lastOfPrev) };
}

/**
 * Convert an inclusive company-date range to a half-open epoch-ms interval
 * `[fromMs, toMsExclusive)` suitable for filtering `clockInAt`.
 */
export function companyDateRangeToMs(
  from: CompanyDate,
  to: CompanyDate,
  timeZone: string
): { fromMs: number; toMsExclusive: number } {
  return {
    fromMs: startOfCompanyDayMs(from, timeZone),
    toMsExclusive: startOfCompanyDayMs(addCompanyDays(to, 1), timeZone),
  };
}
