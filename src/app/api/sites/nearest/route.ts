import { eq } from "drizzle-orm";
import { getDb, sites } from "@/db";
import { haversineMeters } from "@/lib/geo";
import { getCompanyBySlug } from "@/lib/tenancy";

// Reads the request URL (lat/lng/company) and the D1 binding at request time,
// so it can't be statically prerendered.
export const dynamic = "force-dynamic";

/**
 * GET /api/sites/nearest?company=<slug>&lat=<n>&lng=<n>
 *
 * Resolves which Site the worker is standing at from a GPS fix, so the clock
 * page can pick the Site automatically instead of relying on a Site Tag link.
 *
 * Scoped by Company Slug (ADR-0004): only the resolved Company's Sites are
 * considered, so a worker never resolves to (or learns about) another Company's
 * Site. An unknown or malformed slug is a 400.
 *
 * Returns the closest Site whose distance is within its own geofence radius as
 * `{ id, name, distanceM }`. Like /api/sites/[id], we never expose Site
 * coordinates — only the resolved id/name and the distance (ADR-0002). When no
 * Site is in range we 404 with the nearest Site's name + distance so the worker
 * knows how far off they are.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("company");
  const lat = Number(url.searchParams.get("lat"));
  const lng = Number(url.searchParams.get("lng"));

  if (!slug) {
    return Response.json({ error: "Company is required." }, { status: 400 });
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return Response.json(
      { error: "Valid lat and lng are required." },
      { status: 400 }
    );
  }

  try {
    const company = await getCompanyBySlug(slug);
    if (!company) {
      return Response.json({ error: "Unknown company." }, { status: 400 });
    }

    const db = getDb();
    const all = await db
      .select()
      .from(sites)
      .where(eq(sites.companyId, company.id));

    let nearest: { name: string; distanceM: number } | null = null;
    let inRange: { id: string; name: string; distanceM: number } | null = null;

    for (const s of all) {
      const distanceM = haversineMeters(lat, lng, s.latitude, s.longitude);
      if (!nearest || distanceM < nearest.distanceM) {
        nearest = { name: s.name, distanceM };
      }
      if (
        distanceM <= s.radiusM &&
        (!inRange || distanceM < inRange.distanceM)
      ) {
        inRange = { id: s.id, name: s.name, distanceM };
      }
    }

    if (!inRange) {
      return Response.json(
        {
          error: "You're not within range of any site.",
          nearest: nearest
            ? { name: nearest.name, distanceM: Math.round(nearest.distanceM) }
            : undefined,
        },
        { status: 404 }
      );
    }

    return Response.json({
      id: inRange.id,
      name: inRange.name,
      distanceM: Math.round(inRange.distanceM),
    });
  } catch {
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
