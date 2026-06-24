import { and, desc, eq, gte, lt } from "drizzle-orm";
import { getDb, shifts, workers, sites } from "@/db";
import type { ShiftStatus } from "@/lib/types";

/**
 * A Shift row joined with its Worker and Site names, plus the fields the Admin
 * dashboard and CSV export need. Worker/Site names are nullable because the
 * join is a LEFT JOIN (defensive against orphaned references).
 */
export type ShiftRow = {
  id: string;
  workerId: string;
  workerName: string | null;
  siteId: string;
  siteName: string | null;
  clockInAt: number;
  clockOutAt: number | null;
  status: ShiftStatus;
  clockInDistanceM: number;
  clockOutDistanceM: number | null;
  clockInDevice: string;
  clockOutDevice: string | null;
};

export type ShiftFilters = {
  siteId?: string;
  status?: ShiftStatus;
  workerId?: string;
  /** Inclusive lower bound on clockInAt (epoch ms). */
  fromMs?: number;
  /** Exclusive upper bound on clockInAt (epoch ms). */
  toMsExclusive?: number;
};

/**
 * List Shifts (newest clock-in first) joined with Worker + Site names, scoped to
 * a single Company. `companyId` is required and always applied
 * (`eq(shifts.companyId, companyId)`) so an admin read can never span tenants — a
 * missed predicate here is a cross-tenant data leak (ADR-0004).
 */
export async function listShifts(
  companyId: string,
  filters: ShiftFilters = {}
): Promise<ShiftRow[]> {
  const db = getDb();

  const conditions = [eq(shifts.companyId, companyId)];
  if (filters.siteId) conditions.push(eq(shifts.siteId, filters.siteId));
  if (filters.status) conditions.push(eq(shifts.status, filters.status));
  if (filters.workerId) conditions.push(eq(shifts.workerId, filters.workerId));
  if (filters.fromMs != null) conditions.push(gte(shifts.clockInAt, filters.fromMs));
  if (filters.toMsExclusive != null)
    conditions.push(lt(shifts.clockInAt, filters.toMsExclusive));
  const where = conditions.length ? and(...conditions) : undefined;

  return db
    .select({
      id: shifts.id,
      workerId: shifts.workerId,
      workerName: workers.name,
      siteId: shifts.siteId,
      siteName: sites.name,
      clockInAt: shifts.clockInAt,
      clockOutAt: shifts.clockOutAt,
      status: shifts.status,
      clockInDistanceM: shifts.clockInDistanceM,
      clockOutDistanceM: shifts.clockOutDistanceM,
      clockInDevice: shifts.clockInDevice,
      clockOutDevice: shifts.clockOutDevice,
    })
    .from(shifts)
    .leftJoin(workers, eq(shifts.workerId, workers.id))
    .leftJoin(sites, eq(shifts.siteId, sites.id))
    .where(where)
    .orderBy(desc(shifts.clockInAt));
}
