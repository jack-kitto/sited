import type { GeofenceResult } from "@/lib/types";

const EARTH_RADIUS_M = 6_371_008.8; // mean Earth radius (meters)

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Great-circle distance between two coordinates in meters (Haversine).
 *
 * @param aLat latitude of point A in decimal degrees
 * @param aLng longitude of point A in decimal degrees
 * @param bLat latitude of point B in decimal degrees
 * @param bLng longitude of point B in decimal degrees
 */
export function haversineMeters(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number
): number {
  const dLat = toRadians(bLat - aLat);
  const dLng = toRadians(bLng - aLng);
  const lat1 = toRadians(aLat);
  const lat2 = toRadians(bLat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Whether a measured distance falls within a Site's radius. The hard geofence
 * (ADR-0002) refuses any punch where this is false.
 */
export function isWithinRadius(distanceM: number, radiusM: number): boolean {
  return distanceM <= radiusM;
}

/**
 * Human-readable distance. Small distances stay in whole meters (the geofence
 * scale); anything from 1 km up reads in kilometers so a worker who is far away
 * doesn't see an unreadable five-digit meter count (e.g. `52341 m` → `52 km`).
 */
export function formatDistance(meters: number): string {
  const m = Math.round(meters);
  if (m < 1000) return `${m} m`;
  const km = m / 1000;
  // One decimal under 10 km (1.2 km), whole km beyond (52 km).
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
}

/** Convenience: distance + within-radius in one call. */
export function evaluateGeofence(
  fixLat: number,
  fixLng: number,
  siteLat: number,
  siteLng: number,
  radiusM: number
): GeofenceResult {
  const distanceM = haversineMeters(fixLat, fixLng, siteLat, siteLng);
  return { distanceM, withinRadius: isWithinRadius(distanceM, radiusM) };
}
