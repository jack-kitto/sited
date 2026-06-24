import { eq } from "drizzle-orm";
import { companies, getDb, sites } from "@/db";
import { evaluateGeofence } from "@/lib/geo";

function isFiniteNumber(value: number): boolean {
  return Number.isFinite(value);
}

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
 *
 * When the caller passes `?lat=&lng=`, the response additionally includes
 * `{ distanceM, radiusM, withinRadius }` computed server-side. This lets the
 * Site-Tag flow tell the worker they're too far BEFORE they try to punch
 * (mirroring the nearest-Site flow), instead of showing an "on site" form that
 * the server then rejects. Coordinates are still never returned.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = new URL(req.url);
  const lat = Number(url.searchParams.get("lat"));
  const lng = Number(url.searchParams.get("lng"));
  const hasFix =
    url.searchParams.has("lat") &&
    url.searchParams.has("lng") &&
    isFiniteNumber(lat) &&
    isFiniteNumber(lng);

  try {
    const db = getDb();
    const [site] = await db
      .select({
        id: sites.id,
        name: sites.name,
        latitude: sites.latitude,
        longitude: sites.longitude,
        radiusM: sites.radiusM,
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

    const base = {
      id: site.id,
      name: site.name,
      companySlug: site.companySlug,
      companyTimeZone: site.companyTimeZone,
    };

    if (!hasFix) {
      return Response.json(base);
    }

    const geofence = evaluateGeofence(
      lat,
      lng,
      site.latitude,
      site.longitude,
      site.radiusM
    );
    return Response.json({
      ...base,
      distanceM: Math.round(geofence.distanceM),
      radiusM: site.radiusM,
      withinRadius: geofence.withinRadius,
    });
  } catch {
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
