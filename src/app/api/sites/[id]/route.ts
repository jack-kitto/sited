import { eq } from "drizzle-orm";
import { companies, getDb, sites } from "@/db";

/**
 * GET /api/sites/[id]
 *
 * Returns PUBLIC Site info for the clock page as
 * `{ id, name, companySlug, companyTimeZone }`. We deliberately expose no
 * coordinates or radius — the geofence check (ADR-0002) happens server-side, so
 * the client never needs them.
 *
 * The Site Tag flow (`/clock?site=<id>`, no slug in the URL) reads `companySlug`
 * to learn which Company owns this Site, then loads that Company's Roster
 * (ADR-0004). `companyTimeZone` lets that flow render clock times in the right
 * timezone too. Joining Companies keeps the Company inferred from the Site itself.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const db = getDb();
    const [site] = await db
      .select({
        id: sites.id,
        name: sites.name,
        companySlug: companies.slug,
        companyTimeZone: companies.timezone,
      })
      .from(sites)
      .innerJoin(companies, eq(sites.companyId, companies.id))
      .where(eq(sites.id, id))
      .limit(1);

    if (!site) {
      return Response.json({ error: "Site not found" }, { status: 404 });
    }

    return Response.json(site);
  } catch {
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
