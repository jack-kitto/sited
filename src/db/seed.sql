-- Dev seed data for local D1.
--
-- Apply with: npm run seed:local   (wraps wrangler d1 execute --local)
--
-- Worker PINs (plaintext, for local testing only):
--   Alice -> 1234
--   Bob   -> 5678
--   Carol -> 4321
-- The pin_hash values below are PBKDF2-SHA256 strings produced by
-- scripts/hash-pin.mjs (same format as src/lib/pin.ts). Regenerate with:
--   node scripts/hash-pin.mjs 1234 5678 4321
--
-- Idempotent: uses INSERT OR IGNORE with fixed ids so re-running is safe.

-- Sites (Tokyo-area coordinates, 100m default radius).
INSERT OR IGNORE INTO sites (id, name, latitude, longitude, radius_m, created_at) VALUES
  ('site_shinjuku', 'Shinjuku Office',    35.6896, 139.7006, 100, 1750000000000),
  ('site_shibuya',  'Shibuya Warehouse',  35.6595, 139.7005, 100, 1750000000000);

-- Workers (Roster). active=1 (true).
INSERT OR IGNORE INTO workers (id, name, pin_hash, active, created_at) VALUES
  ('worker_alice', 'Alice', 'pbkdf2$100000$Gdf+0Z8oEHoQpT7NhoW3KA==$HgDyvVX1rBx/z/p/afPV5aD0xLfB10Uvw9J8XfQjBmQ=', 1, 1750000000000),
  ('worker_bob',   'Bob',   'pbkdf2$100000$SydD+jBzNg5YozsTWfPZ/g==$uYrpWNNI1REY+Vxur90MhK7m3BsHDkgZopxBuEiGbw4=', 1, 1750000000000),
  ('worker_carol', 'Carol', 'pbkdf2$100000$DQwLfCDBH7bK/ww8lk7ckA==$SRn+RMR4NOV8YwaQ2I0+X66D09wakHgOTCAr7qGDMws=', 1, 1750000000000);
