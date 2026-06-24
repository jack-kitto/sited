import { asc, eq } from "drizzle-orm";
import { getDb, sites } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { newId } from "@/lib/ids";

/**
 * GET /api/admin/sites
 * List Sites. Guarded.
 */
export async function GET(): Promise<Response> {
  const session = await requireAdmin();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const db = getDb();
  const rows = await db
    .select()
    .from(sites)
    .where(eq(sites.companyId, session.companyId))
    .orderBy(asc(sites.name));
  return Response.json({ sites: rows });
}

type CreateBody = {
  name?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  radiusM?: unknown;
};

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

/**
 * POST /api/admin/sites
 * Create a Site. Body: { name, latitude, longitude, radiusM? }. Guarded.
 */
export async function POST(request: Request): Promise<Response> {
  const session = await requireAdmin();
  if (!session) return new Response("Unauthorized", { status: 401 });

  let body: CreateBody;
  try {
    body = (await request.json()) as CreateBody;
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const latitude = toNumber(body.latitude);
  const longitude = toNumber(body.longitude);
  const radiusM = body.radiusM === undefined ? 100 : toNumber(body.radiusM);

  if (!name) return Response.json({ error: "Name is required" }, { status: 400 });
  if (latitude == null || latitude < -90 || latitude > 90) {
    return Response.json({ error: "Valid latitude is required" }, { status: 400 });
  }
  if (longitude == null || longitude < -180 || longitude > 180) {
    return Response.json({ error: "Valid longitude is required" }, { status: 400 });
  }
  if (radiusM == null || radiusM <= 0) {
    return Response.json({ error: "Radius must be a positive number" }, { status: 400 });
  }

  const db = getDb();
  const id = newId("site");
  await db.insert(sites).values({
    id,
    companyId: session.companyId,
    name,
    latitude,
    longitude,
    radiusM: Math.round(radiusM),
  });

  return Response.json({
    site: { id, name, latitude, longitude, radiusM: Math.round(radiusM) },
  });
}
