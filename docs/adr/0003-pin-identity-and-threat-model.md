# PIN-based identity and a "deter, don't prevent" threat model

Workers identify themselves by picking their name from the Roster and entering a personal PIN — no real accounts, passwords, or selfies. We capture device info (browser, IP) as a fraud signal. We explicitly accept that PINs can be shared and that browser GPS can be spoofed, so the system deters casual fraud (buddy-punching, clocking in off-site) but does not try to be bulletproof. This trades fraud resistance for a fast, low-friction flow on shared or personal phones.

## Consequences

- Records are trustworthy enough for honest workers with light deterrence, not for adversarial environments.
- Stronger measures (selfie capture, server-side IP geolocation cross-check, device attestation) are deliberately deferred as future work.
- The Admin authenticates with a single shared password (server secret), consistent with the lightweight posture; multi-admin accounts are future work if auditability is needed.
