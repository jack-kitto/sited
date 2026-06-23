import { asc, eq } from "drizzle-orm";
import { getDb, workers } from "@/db";

/**
 * GET /api/workers
 *
 * Returns the Roster of ACTIVE workers as `[{ id, name }]` for the clock-page
 * name picker. Never returns `pinHash` (ADR-0003).
 */
export async function GET() {
  try {
    const db = getDb();
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
