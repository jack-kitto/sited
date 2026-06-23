# PIN-based identity and a "deter, don't prevent" threat model

Workers identify themselves by picking their name from the Roster and entering a personal PIN — no real accounts, passwords, or selfies. We capture device info (browser, IP) as a fraud signal. We explicitly accept that PINs can be shared and that browser GPS can be spoofed, so the system deters casual fraud (buddy-punching, clocking in off-site) but does not try to be bulletproof. This trades fraud resistance for a fast, low-friction flow on shared or personal phones.

## Consequences

- Records are trustworthy enough for honest workers with light deterrence, not for adversarial environments.
- Stronger measures (selfie capture, server-side IP geolocation cross-check, device attestation) are deliberately deferred as future work.
- Admin authentication was originally a single global password (`ADMIN_PASSWORD` env secret). **Superseded by ADR-0004:** each Company has its own shared admin password (hashed in D1); session tokens carry `companyId`. Per-Admin accounts remain future work if auditability is needed.
