// Custom Worker entry point.
//
// OpenNext generates a fetch-only handler at `.open-next/worker.js` during
// `opennextjs-cloudflare build`. We wrap it here so we can also expose a
// `scheduled` handler for the hourly cron trigger defined in wrangler.jsonc.
//
// See https://opennext.js.org/cloudflare/howtos/custom-worker

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore `.open-next/worker.js` is generated only at build time, so this
// import resolves once `opennextjs-cloudflare build` has run. (A ts-ignore is
// used rather than the stricter alternative, which would flip to an "unused
// directive" error after the generated file exists.)
import { default as handler } from "./.open-next/worker.js";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { schema, shifts, companies } from "@/db/schema";
import { nowMs, autoCloseAtFor, isPastMidnight } from "@/lib/time";

export default {
  fetch: handler.fetch,

  // Incomplete-shift sweep. Runs hourly (see triggers.crons). Finds Open
  // Shifts that have crossed midnight and auto-closes each one at 16:30 on its
  // own day with status "incomplete" and no clock-out location (CONTEXT.md).
  // Each Shift is evaluated in ITS OWN Company's timezone (ADR-0004): we join
  // Shifts -> Companies so the midnight cutoff and 16:30 auto-close are computed
  // per Company, never against one global constant. We build the Drizzle client
  // directly from `env` because the getCloudflareContext() ALS may not be
  // populated in a scheduled handler.
  async scheduled(
    _event: ScheduledController,
    env: CloudflareEnv,
    _ctx: ExecutionContext
  ): Promise<void> {
    try {
      const db = drizzle(env.DB, { schema });
      const now = nowMs();

      const openShifts = await db
        .select({
          id: shifts.id,
          clockInAt: shifts.clockInAt,
          timeZone: companies.timezone,
        })
        .from(shifts)
        .innerJoin(companies, eq(shifts.companyId, companies.id))
        .where(eq(shifts.status, "open"));

      let closed = 0;
      for (const shift of openShifts) {
        if (!isPastMidnight(shift.clockInAt, now, shift.timeZone)) continue;
        await db
          .update(shifts)
          .set({
            status: "incomplete",
            clockOutAt: autoCloseAtFor(shift.clockInAt, shift.timeZone),
            updatedAt: now,
          })
          .where(eq(shifts.id, shift.id));
        closed++;
      }

      console.log(
        `[sweep] scanned ${openShifts.length} open shift(s), auto-closed ${closed} as incomplete`
      );
    } catch (err) {
      console.error("[sweep] incomplete-shift sweep failed:", err);
    }
  },
} satisfies ExportedHandler<CloudflareEnv>;
