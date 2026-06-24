import { asc } from "drizzle-orm";
import { getDb, workers } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { hashPin } from "@/lib/pin";
import { newId } from "@/lib/ids";
import { LEGACY_ADMIN_COMPANY_ID } from "@/lib/tenancy";

/**
 * GET /api/admin/workers
 * List Roster workers (never exposes pinHash). Guarded.
 */
export async function GET(): Promise<Response> {
  const session = await requireAdmin();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const db = getDb();
  const rows = await db
    .select({
      id: workers.id,
      name: workers.name,
      active: workers.active,
      createdAt: workers.createdAt,
    })
    .from(workers)
    .orderBy(asc(workers.name));

  return Response.json({ workers: rows });
}

type CreateBody = { name?: unknown; pin?: unknown };

/**
 * POST /api/admin/workers
 * Create a Roster worker. Body: { name, pin }. The PIN is hashed; never stored
 * in plaintext. Guarded.
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
  const pin = typeof body.pin === "string" ? body.pin.trim() : "";
  if (!name) return Response.json({ error: "Name is required" }, { status: 400 });
  if (!pin) return Response.json({ error: "PIN is required" }, { status: 400 });

  const db = getDb();
  const pinHash = await hashPin(pin);
  const id = newId("worker");
  // TODO(issue 0004): scope to the admin session's Company instead.
  await db
    .insert(workers)
    .values({ id, companyId: LEGACY_ADMIN_COMPANY_ID, name, pinHash });

  return Response.json({
    worker: { id, name, active: true },
  });
}
