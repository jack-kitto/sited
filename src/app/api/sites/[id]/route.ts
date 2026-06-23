import { eq } from "drizzle-orm";
import { getDb, sites } from "@/db";

/**
 * GET /api/sites/[id]
 *
 * Returns PUBLIC Site info for the clock page. We deliberately expose only
 * `{ id, name }` — the geofence check (ADR-0002) happens server-side, so the
 * client never needs the Site's coordinates or radius.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const db = getDb();
    const [site] = await db
      .select({ id: sites.id, name: sites.name })
      .from(sites)
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
