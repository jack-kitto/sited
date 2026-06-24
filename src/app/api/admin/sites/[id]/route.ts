import { and, eq } from "drizzle-orm";
import { getDb, shifts, sites } from "@/db";
import { requireAdmin } from "@/lib/auth";

type PatchBody = {
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
 * PATCH /api/admin/sites/[id]
 * Update a Site's name, coordinates, and/or geofence radius. Guarded.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const session = await requireAdmin();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const updates: {
    name?: string;
    latitude?: number;
    longitude?: number;
    radiusM?: number;
  } = {};

  if (body.name !== undefined) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) return Response.json({ error: "Name cannot be empty" }, { status: 400 });
    updates.name = name;
  }

  if (body.latitude !== undefined) {
    const latitude = toNumber(body.latitude);
    if (latitude == null || latitude < -90 || latitude > 90) {
      return Response.json({ error: "Valid latitude is required" }, { status: 400 });
    }
    updates.latitude = latitude;
  }

  if (body.longitude !== undefined) {
    const longitude = toNumber(body.longitude);
    if (longitude == null || longitude < -180 || longitude > 180) {
      return Response.json({ error: "Valid longitude is required" }, { status: 400 });
    }
    updates.longitude = longitude;
  }

  if (body.radiusM !== undefined) {
    const radiusM = toNumber(body.radiusM);
    if (radiusM == null || radiusM <= 0) {
      return Response.json({ error: "Radius must be a positive number" }, { status: 400 });
    }
    updates.radiusM = Math.round(radiusM);
  }

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: "No fields to update" }, { status: 400 });
  }

  // Scope the UPDATE to the session Company so a Site belonging to another
  // Company can never be edited by id (cross-tenant write, ADR-0004). A
  // mismatched id matches no row and returns 404 with no mutation.
  const db = getDb();
  const updated = await db
    .update(sites)
    .set(updates)
    .where(and(eq(sites.id, id), eq(sites.companyId, session.companyId)))
    .returning();

  if (updated.length === 0) {
    return Response.json({ error: "Site not found" }, { status: 404 });
  }

  return Response.json({ site: updated[0] });
}

/**
 * DELETE /api/admin/sites/[id]
 * Remove a Site. Scoped to the session Company (ADR-0004). Refused when the
 * Site has recorded Shifts, so a delete can never orphan Shift history — the
 * Admin must keep the Site for its audit trail (or delete those Shifts first).
 * Guarded.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const session = await requireAdmin();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const db = getDb();

  // A Shift references its Site; deleting a Site with history would orphan rows.
  const [existingShift] = await db
    .select({ id: shifts.id })
    .from(shifts)
    .where(and(eq(shifts.siteId, id), eq(shifts.companyId, session.companyId)))
    .limit(1);
  if (existingShift) {
    return Response.json(
      {
        error:
          "This site has recorded shifts and can't be deleted. Delete its shifts first if you really need to remove it.",
      },
      { status: 409 }
    );
  }

  const deleted = await db
    .delete(sites)
    .where(and(eq(sites.id, id), eq(sites.companyId, session.companyId)))
    .returning({ id: sites.id });

  if (deleted.length === 0) {
    return Response.json({ error: "Site not found" }, { status: 404 });
  }

  return Response.json({ ok: true });
}
