import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import type { ShiftStatus } from "@/lib/types";

/**
 * A fixed job location workers clock in and out of. Each Site has its own
 * Site Tag (QR/NFC) that opens the app at /clock?site=<id>.
 */
export const sites = sqliteTable("sites", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  /** Geofence radius in meters (hard block, ADR-0002). */
  radiusM: integer("radius_m").notNull().default(100),
  /** Epoch milliseconds. */
  createdAt: integer("created_at")
    .notNull()
    .$defaultFn(() => Date.now()),
});

/**
 * A person on the Roster who is permitted to clock in. Identified by name +
 * personal PIN (ADR-0003).
 */
export const workers = sqliteTable("workers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  /** PBKDF2-SHA256 hash string, see src/lib/pin.ts. */
  pinHash: text("pin_hash").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  /** Epoch milliseconds. */
  createdAt: integer("created_at")
    .notNull()
    .$defaultFn(() => Date.now()),
});

/**
 * A single clock-in/clock-out pair for one Worker at one Site. A Worker may
 * have at most one Open Shift at a time; clock-out must be at the same Site.
 */
export const shifts = sqliteTable("shifts", {
  id: text("id").primaryKey(),
  workerId: text("worker_id")
    .notNull()
    .references(() => workers.id),
  siteId: text("site_id")
    .notNull()
    .references(() => sites.id),

  // Clock-in (always present).
  clockInAt: integer("clock_in_at").notNull(),
  clockInLat: real("clock_in_lat").notNull(),
  clockInLng: real("clock_in_lng").notNull(),
  clockInAccuracy: real("clock_in_accuracy").notNull(),
  clockInDistanceM: real("clock_in_distance_m").notNull(),
  /** JSON-encoded DeviceInfo: { userAgent, ip }. */
  clockInDevice: text("clock_in_device").notNull(),

  // Clock-out (null while the Shift is Open / Incomplete).
  clockOutAt: integer("clock_out_at"),
  clockOutLat: real("clock_out_lat"),
  clockOutLng: real("clock_out_lng"),
  clockOutAccuracy: real("clock_out_accuracy"),
  clockOutDistanceM: real("clock_out_distance_m"),
  /** JSON-encoded DeviceInfo: { userAgent, ip }. */
  clockOutDevice: text("clock_out_device"),

  status: text("status")
    .notNull()
    .$type<ShiftStatus>()
    .default("open"),

  /** Epoch milliseconds. */
  createdAt: integer("created_at")
    .notNull()
    .$defaultFn(() => Date.now()),
  /** Epoch milliseconds. */
  updatedAt: integer("updated_at")
    .notNull()
    .$defaultFn(() => Date.now()),
});

export type Site = typeof sites.$inferSelect;
export type NewSite = typeof sites.$inferInsert;
export type Worker = typeof workers.$inferSelect;
export type NewWorker = typeof workers.$inferInsert;
export type Shift = typeof shifts.$inferSelect;
export type NewShift = typeof shifts.$inferInsert;

// Re-exported so callers can `import { schema } from "@/db/schema"`.
export const schema = { sites, workers, shifts };
