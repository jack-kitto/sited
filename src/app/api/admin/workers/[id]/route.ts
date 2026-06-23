import { eq } from "drizzle-orm";
import { getDb, workers } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { hashPin } from "@/lib/pin";

type PatchBody = {
  name?: unknown;
  pin?: unknown;
  active?: unknown;
};

/**
 * PATCH /api/admin/workers/[id]
 * Rename, reset PIN (re-hashed), and/or toggle active. Guarded.
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

  const updates: { name?: string; pinHash?: string; active?: boolean } = {};

  if (body.name !== undefined) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) return Response.json({ error: "Name cannot be empty" }, { status: 400 });
    updates.name = name;
  }

  if (body.pin !== undefined) {
    const pin = typeof body.pin === "string" ? body.pin.trim() : "";
    if (!pin) return Response.json({ error: "PIN cannot be empty" }, { status: 400 });
    updates.pinHash = await hashPin(pin);
  }

  if (body.active !== undefined) {
    if (typeof body.active !== "boolean") {
      return Response.json({ error: "active must be a boolean" }, { status: 400 });
    }
    updates.active = body.active;
  }

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: "No fields to update" }, { status: 400 });
  }

  const db = getDb();
  const updated = await db
    .update(workers)
    .set(updates)
    .where(eq(workers.id, id))
    .returning({
      id: workers.id,
      name: workers.name,
      active: workers.active,
    });

  if (updated.length === 0) {
    return Response.json({ error: "Worker not found" }, { status: 404 });
  }

  return Response.json({ worker: updated[0] });
}
