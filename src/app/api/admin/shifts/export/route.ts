import { requireAdmin } from "@/lib/auth";
import { listShifts } from "@/app/admin/_lib/shifts-query";
import {
  formatTs,
  formatDistance,
  formatDuration,
  workedMs,
} from "@/app/admin/_lib/format";
import { resolveShiftQuery } from "@/app/admin/_lib/filters";
import type { DeviceInfo } from "@/lib/types";

function csvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  // Quote when the value contains a delimiter, quote, or newline.
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function parseDevice(json: string | null): DeviceInfo | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as DeviceInfo;
  } catch {
    return null;
  }
}

/**
 * GET /api/admin/shifts/export
 * Streams the currently-filtered Shifts as a CSV attachment, with times in
 * COMPANY_TZ and Worked Hours per row plus a total. Honors the same
 * siteId/status/workerId/from/to filters as the dashboard. Guarded.
 */
export async function GET(req: Request): Promise<Response> {
  const session = await requireAdmin();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const params = Object.fromEntries(new URL(req.url).searchParams);
  const query = resolveShiftQuery(params);

  const rows = await listShifts({
    siteId: query.siteId,
    status: query.status,
    workerId: query.workerId,
    fromMs: query.fromMs,
    toMsExclusive: query.toMsExclusive,
  });

  const header = [
    "Worker",
    "Site",
    "Clock-in (Asia/Tokyo)",
    "Clock-out (Asia/Tokyo)",
    "Worked hours",
    "Status",
    "Clock-in distance (m)",
    "Clock-out distance (m)",
    "Clock-in user agent",
    "Clock-in IP",
    "Clock-out user agent",
    "Clock-out IP",
  ];

  const lines = [header.map(csvCell).join(",")];

  let totalMs = 0;
  for (const r of rows) {
    const inDevice = parseDevice(r.clockInDevice);
    const outDevice = parseDevice(r.clockOutDevice);
    const ms = workedMs(r.clockInAt, r.clockOutAt);
    if (ms != null) totalMs += ms;
    lines.push(
      [
        csvCell(r.workerName ?? r.workerId),
        csvCell(r.siteName ?? r.siteId),
        csvCell(formatTs(r.clockInAt)),
        csvCell(r.clockOutAt == null ? "" : formatTs(r.clockOutAt)),
        csvCell(ms == null ? "" : formatDuration(ms)),
        csvCell(r.status),
        csvCell(formatDistance(r.clockInDistanceM)),
        csvCell(r.clockOutDistanceM == null ? "" : formatDistance(r.clockOutDistanceM)),
        csvCell(inDevice?.userAgent ?? ""),
        csvCell(inDevice?.ip ?? ""),
        csvCell(outDevice?.userAgent ?? ""),
        csvCell(outDevice?.ip ?? ""),
      ].join(",")
    );
  }

  // Trailing total row for Worked Hours.
  lines.push("");
  lines.push(
    [csvCell("Total"), "", "", "", csvCell(formatDuration(totalMs))].join(",")
  );

  const csv = lines.join("\r\n");
  const filename = `shifts-${query.range.from}_to_${query.range.to}.csv`;

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
