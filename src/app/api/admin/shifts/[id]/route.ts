import { and, eq } from "drizzle-orm";
import { getDb, shifts } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { nowMs } from "@/lib/time";
import { SHIFT_STATUSES, type ShiftStatus } from "@/lib/types";

type PatchBody = {
  clockInAt?: number | null;
  clockOutAt?: number | null;
  status?: string;
};

/**
 * PATCH /api/admin/shifts/[id]
 * Edit a Shift: clock-in time, clock-out time, and/or status (e.g. resolving
 * an Incomplete Shift). Guarded.
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
    clockInAt?: number;
    clockOutAt?: number | null;
    status?: ShiftStatus;
    updatedAt: number;
  } = { updatedAt: nowMs() };

  if (body.clockInAt !== undefined) {
    if (typeof body.clockInAt !== "number" || !Number.isFinite(body.clockInAt)) {
      return Response.json({ error: "clockInAt must be a number" }, { status: 400 });
    }
    updates.clockInAt = body.clockInAt;
  }

  if (body.clockOutAt !== undefined) {
    if (body.clockOutAt === null) {
      updates.clockOutAt = null;
    } else if (
      typeof body.clockOutAt !== "number" ||
      !Number.isFinite(body.clockOutAt)
    ) {
      return Response.json(
        { error: "clockOutAt must be a number or null" },
        { status: 400 }
      );
    } else {
      updates.clockOutAt = body.clockOutAt;
    }
  }

  if (body.status !== undefined) {
    if (!(SHIFT_STATUSES as readonly string[]).includes(body.status)) {
      return Response.json({ error: "Invalid status" }, { status: 400 });
    }
    updates.status = body.status as ShiftStatus;
  }

  // Scope the UPDATE to the session Company so a Shift belonging to another
  // Company can never be edited/resolved by id (cross-tenant write, ADR-0004). A
  // mismatched id matches no row and returns 404 with no mutation.
  const db = getDb();
  const updated = await db
    .update(shifts)
    .set(updates)
    .where(and(eq(shifts.id, id), eq(shifts.companyId, session.companyId)))
    .returning();

  if (updated.length === 0) {
    return Response.json({ error: "Shift not found" }, { status: 404 });
  }

  return Response.json({ shift: updated[0] });
}

/**
 * DELETE /api/admin/shifts/[id]
 * Permanently remove a Shift. Scoped to the session Company (ADR-0004) so a
 * Shift belonging to another Company can never be deleted by id. Guarded.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const session = await requireAdmin();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const db = getDb();

  const deleted = await db
    .delete(shifts)
    .where(and(eq(shifts.id, id), eq(shifts.companyId, session.companyId)))
    .returning({ id: shifts.id });

  if (deleted.length === 0) {
    return Response.json({ error: "Shift not found" }, { status: 404 });
  }

  return Response.json({ ok: true });
}
