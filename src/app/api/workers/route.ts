import { and, asc, eq } from "drizzle-orm";
import { getDb, workers } from "@/db";
import { getCompanyBySlug } from "@/lib/tenancy";

// Reads the request URL (the `company` slug) and the D1 binding at request
// time, so it can't be statically prerendered.
export const dynamic = "force-dynamic";

/**
 * GET /api/workers?company=<slug>
 *
 * Returns the Roster of ACTIVE workers as `[{ id, name }]` for the clock-page
 * name picker. Never returns `pinHash` (ADR-0003).
 *
 * Scoped by Company Slug (ADR-0004): only that Company's active Workers are
 * returned. An unknown or malformed slug yields an empty Roster — never another
 * Company's Workers.
 *
 * When no `company` is supplied this falls back to the legacy unscoped Roster so
 * the bare Site-Tag flow (`/clock?site=`) keeps working; deriving the Company
 * from the Site is issue 0003.
 */
export async function GET(req: Request) {
  try {
    const db = getDb();
    const slug = new URL(req.url).searchParams.get("company");

    if (slug !== null) {
      const company = await getCompanyBySlug(slug);
      if (!company) return Response.json([]);

      const roster = await db
        .select({ id: workers.id, name: workers.name })
        .from(workers)
        .where(and(eq(workers.companyId, company.id), eq(workers.active, true)))
        .orderBy(asc(workers.name));

      return Response.json(roster);
    }

    const roster = await db
      .select({ id: workers.id, name: workers.name })
      .from(workers)
      .where(eq(workers.active, true))
      .orderBy(asc(workers.name));

    return Response.json(roster);
  } catch {
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
