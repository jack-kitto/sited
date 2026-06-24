import type { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { listShifts } from "@/app/admin/_lib/shifts-query";
import { resolveShiftQuery } from "@/app/admin/_lib/filters";

/**
 * GET /api/admin/shifts?siteId=&status=&workerId=&from=&to=
 * Returns Shifts joined with Worker + Site names, honoring the same filters as
 * the dashboard (date range defaults to the current month). Guarded.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const session = await requireAdmin();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const params = Object.fromEntries(request.nextUrl.searchParams);
  const query = resolveShiftQuery(params);

  const rows = await listShifts(session.companyId, {
    siteId: query.siteId,
    status: query.status,
    workerId: query.workerId,
    fromMs: query.fromMs,
    toMsExclusive: query.toMsExclusive,
  });
  return Response.json({ shifts: rows, range: query.range });
}
