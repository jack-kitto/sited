# Hard geofence block on clock-in and clock-out

A Worker can only clock in or out when the browser reports a GPS location within the target Site's radius (default 100m). If location permission is denied, unavailable, or reports a position outside the radius, the punch is refused — there is no soft override. We chose this because the whole point of the app is to prove physical presence, and a soft-flag approach would let anyone clock in from anywhere.

## Consequences

- Legitimate Workers will occasionally be blocked when GPS is poor (indoors, urban canyons, cold start). This is an accepted cost of trustworthy records.
- The per-Site radius is admin-tunable so individual sites with bad reception can be loosened.
- Geolocation requires a secure context (HTTPS), so the app must always be served over HTTPS.
