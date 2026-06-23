/**
 * Shared TypeScript types/enums used across the data layer and (later) the
 * feature code. Other agents import from "@/lib/types".
 */

/**
 * Lifecycle of a Shift.
 * - "open":       clocked in, not yet clocked out (the Open Shift).
 * - "complete":   clocked in and out normally.
 * - "incomplete": never closed by the Worker; auto-closed by the system at
 *                 16:30 on the shift's own day (see CONTEXT.md, src/lib/time.ts).
 */
export type ShiftStatus = "open" | "complete" | "incomplete";

export const SHIFT_STATUSES = ["open", "complete", "incomplete"] as const;

/**
 * Captured at clock-in and clock-out as a lightweight fraud signal
 * (ADR-0003: deter, don't prevent). Stored JSON-encoded on the Shift.
 */
export type DeviceInfo = {
  userAgent: string | null;
  ip: string | null;
};

/**
 * A browser geolocation reading used to evaluate the hard geofence
 * (ADR-0002). Coordinates are decimal degrees; accuracy is in meters.
 */
export type GeoFix = {
  latitude: number;
  longitude: number;
  accuracy: number;
};

/** Result of evaluating a punch against a Site's geofence. */
export type GeofenceResult = {
  distanceM: number;
  withinRadius: boolean;
};
