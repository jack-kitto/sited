import { and, eq } from "drizzle-orm";
import { getDb, shifts, sites, workers } from "@/db";
import { evaluateGeofence } from "@/lib/geo";
import { verifyPin } from "@/lib/pin";
import { newId } from "@/lib/ids";
import { nowMs } from "@/lib/time";
import type { DeviceInfo } from "@/lib/types";

/** Request body for POST /api/clock. */
type ClockRequest = {
  siteId: string;
  workerId: string;
  pin: string;
  fix: { lat: number; lng: number; accuracy: number } | null;
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** Capture a lightweight fraud signal from request headers (ADR-0003). */
function deviceFromHeaders(req: Request): DeviceInfo {
  const ip =
    req.headers.get("CF-Connecting-IP") ??
    req.headers.get("x-forwarded-for") ??
    null;
  return {
    userAgent: req.headers.get("user-agent"),
    ip,
  };
}

/**
 * POST /api/clock
 *
 * Auto-decides clock-in vs clock-out for a Worker at a Site, enforcing the
 * hard geofence (ADR-0002) and the one-Open-Shift-at-a-time rule.
 */
export async function POST(req: Request) {
  let body: ClockRequest;
  try {
    body = (await req.json()) as ClockRequest;
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { siteId, workerId, pin, fix } = body ?? {};

  if (
    typeof siteId !== "string" ||
    typeof workerId !== "string" ||
    typeof pin !== "string" ||
    siteId.length === 0 ||
    workerId.length === 0 ||
    pin.length === 0
  ) {
    return Response.json(
      { error: "Missing site, worker, or PIN." },
      { status: 400 }
    );
  }

  // Hard geofence (ADR-0002): a GPS fix is mandatory for any punch.
  if (
    !fix ||
    !isFiniteNumber(fix.lat) ||
    !isFiniteNumber(fix.lng) ||
    !isFiniteNumber(fix.accuracy)
  ) {
    return Response.json(
      {
        error:
          "Location is required to clock in or out. Enable location and try again.",
      },
      { status: 400 }
    );
  }

  try {
    const db = getDb();

    const [site] = await db
      .select()
      .from(sites)
      .where(eq(sites.id, siteId))
      .limit(1);
    if (!site) {
      return Response.json({ error: "Site not found" }, { status: 404 });
    }

    const [worker] = await db
      .select()
      .from(workers)
      .where(eq(workers.id, workerId))
      .limit(1);
    if (!worker) {
      return Response.json({ error: "Worker not found" }, { status: 404 });
    }
    if (!worker.active) {
      return Response.json(
        { error: "This worker is not active. Contact your admin." },
        { status: 403 }
      );
    }

    const pinOk = await verifyPin(pin, worker.pinHash);
    if (!pinOk) {
      return Response.json({ error: "Incorrect PIN" }, { status: 401 });
    }

    const geofence = evaluateGeofence(
      fix.lat,
      fix.lng,
      site.latitude,
      site.longitude,
      site.radiusM
    );
    const distanceM = Math.round(geofence.distanceM);
    if (!geofence.withinRadius) {
      return Response.json(
        {
          error: `You are ${distanceM}m from ${site.name}, outside the ${site.radiusM}m radius. Move closer and try again.`,
          distanceM,
          radiusM: site.radiusM,
        },
        { status: 403 }
      );
    }

    const now = nowMs();
    const device = JSON.stringify(deviceFromHeaders(req));

    // A Worker may have at most one Open Shift at a time (CONTEXT.md).
    const [openShift] = await db
      .select()
      .from(shifts)
      .where(and(eq(shifts.workerId, workerId), eq(shifts.status, "open")))
      .limit(1);

    if (openShift) {
      // Clock-out must happen at the same Site as clock-in.
      if (openShift.siteId !== siteId) {
        const [otherSite] = await db
          .select({ name: sites.name })
          .from(sites)
          .where(eq(sites.id, openShift.siteId))
          .limit(1);
        const otherName = otherSite?.name ?? "another site";
        return Response.json(
          {
            error: `You have an open shift at ${otherName}; clock out there first.`,
          },
          { status: 409 }
        );
      }

      // CLOCK OUT at this Site.
      await db
        .update(shifts)
        .set({
          clockOutAt: now,
          clockOutLat: fix.lat,
          clockOutLng: fix.lng,
          clockOutAccuracy: fix.accuracy,
          clockOutDistanceM: geofence.distanceM,
          clockOutDevice: device,
          status: "complete",
          updatedAt: now,
        })
        .where(eq(shifts.id, openShift.id));

      return Response.json({
        action: "clocked_out",
        shiftId: openShift.id,
        siteName: site.name,
        workerName: worker.name,
        at: now,
        distanceM,
      });
    }

    // CLOCK IN: open a new Shift.
    const shiftId = newId("shift");
    await db.insert(shifts).values({
      id: shiftId,
      // A Shift belongs to its Site's Company (ADR-0004). Cross-tenant punches
      // are blocked in a later slice; here the Shift simply inherits the Site.
      companyId: site.companyId,
      workerId,
      siteId,
      clockInAt: now,
      clockInLat: fix.lat,
      clockInLng: fix.lng,
      clockInAccuracy: fix.accuracy,
      clockInDistanceM: geofence.distanceM,
      clockInDevice: device,
      status: "open",
      createdAt: now,
      updatedAt: now,
    });

    return Response.json({
      action: "clocked_in",
      shiftId,
      siteName: site.name,
      workerName: worker.name,
      at: now,
      distanceM,
    });
  } catch {
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
