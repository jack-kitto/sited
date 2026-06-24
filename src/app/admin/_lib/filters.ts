import { SHIFT_STATUSES, type ShiftStatus } from "@/lib/types";
import {
  companyDateOf,
  companyDateRangeToMs,
  formatCompanyDate,
  parseCompanyDate,
  presetRange,
  type DateRangePreset,
  type DateRangeStrings,
} from "@/lib/time";

/**
 * Raw, untrusted shift-filter values as they arrive from the URL search params.
 * Shared by the /{slug}/admin shifts page, the /{slug}/admin/workers/[id]
 * detail page, and the CSV export route so the three always agree on what "the
 * current view" is.
 */
export type RawShiftParams = {
  siteId?: string;
  status?: string;
  from?: string;
  to?: string;
  workerId?: string;
};

export type ResolvedShiftQuery = {
  siteId?: string;
  status?: ShiftStatus;
  workerId?: string;
  /** The inclusive date range actually applied (defaults to the current month). */
  range: DateRangeStrings;
  fromMs: number;
  toMsExclusive: number;
};

/**
 * Normalize raw params into a validated query. All calendar-day math (the
 * default range, "today" bounds, and the epoch-ms interval) is computed in the
 * session Company's `timeZone` (ADR-0004) — never a global constant. When no
 * date range is given the view falls back to `defaultPreset` (the current month
 * unless overridden). `validSiteIds`, when provided, drops a `siteId` that
 * doesn't exist.
 */
export function resolveShiftQuery(
  params: RawShiftParams,
  timeZone: string,
  opts: { validSiteIds?: string[]; defaultPreset?: DateRangePreset } = {}
): ResolvedShiftQuery {
  const status =
    params.status && (SHIFT_STATUSES as readonly string[]).includes(params.status)
      ? (params.status as ShiftStatus)
      : undefined;

  const siteId =
    params.siteId &&
    (!opts.validSiteIds || opts.validSiteIds.includes(params.siteId))
      ? params.siteId
      : undefined;

  const fromValid = params.from && parseCompanyDate(params.from) ? params.from : undefined;
  const toValid = params.to && parseCompanyDate(params.to) ? params.to : undefined;

  let range: DateRangeStrings;
  if (fromValid && toValid) {
    range = { from: fromValid, to: toValid };
  } else if (fromValid && !toValid) {
    range = {
      from: fromValid,
      to: formatCompanyDate(companyDateOf(Date.now(), timeZone)),
    };
  } else if (!fromValid && toValid) {
    range = { from: toValid, to: toValid };
  } else {
    range = presetRange(opts.defaultPreset ?? "this_month", timeZone);
  }

  // Guard against an inverted range (from after to).
  if (range.from > range.to) range = { from: range.to, to: range.from };

  const { fromMs, toMsExclusive } = companyDateRangeToMs(
    parseCompanyDate(range.from)!,
    parseCompanyDate(range.to)!,
    timeZone
  );

  return {
    siteId,
    status,
    workerId: params.workerId || undefined,
    range,
    fromMs,
    toMsExclusive,
  };
}

/** Build a query string from the filter fields (omitting empty values). */
export function buildShiftQueryString(q: RawShiftParams): string {
  const p = new URLSearchParams();
  if (q.siteId) p.set("siteId", q.siteId);
  if (q.status) p.set("status", q.status);
  if (q.from) p.set("from", q.from);
  if (q.to) p.set("to", q.to);
  if (q.workerId) p.set("workerId", q.workerId);
  return p.toString();
}
