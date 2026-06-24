-- Multi-tenant Companies (ADR-0004) — data-preserving migration.
--
-- Adds the `companies` table and a `company_id` owner to every tenant-scoped
-- table, backfilling all existing single-tenant rows into ONE first Company
-- ("wl"). This is intentionally NOT a clean break: the prior single-tenant
-- Sites, Workers, and Shifts are preserved and become the first Company's data.
--
-- Why ALTER ADD COLUMN (not a table rebuild): D1's executor runs each migration
-- inside a transaction and enforces foreign keys on DROP TABLE, ignoring both
-- `PRAGMA foreign_keys=OFF` and `PRAGMA defer_foreign_keys`. That makes the
-- usual SQLite "create-new / copy / drop / rename" rebuild impossible here, so
-- we add the column in place instead. A NOT NULL column added to a populated
-- table requires a DEFAULT, so existing rows are backfilled to 'company_wl'.
--
-- No DB-level FOREIGN KEY is added on `company_id`: D1 does not reliably enforce
-- FKs, and ADR-0004 enforces tenant isolation in application code on every
-- query. The `company_id` columns in src/db/schema.ts keep their `.references()`
-- for intent and types; Drizzle's NOT NULL (no default) typing also forces app
-- inserts to pass `company_id` explicitly, so the DEFAULT below is only ever the
-- migration backfill value, never used by application writes.
--
-- The first Company's admin password is left LOCKED (empty hash, which can never
-- verify). The Platform Operator sets the real password after migrating:
--   npm run provision -- --set-password --slug wl --password "<password>" [--remote]

CREATE TABLE `companies` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`admin_password_hash` text NOT NULL,
	`timezone` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `companies_slug_unique` ON `companies` (`slug`);--> statement-breakpoint
INSERT INTO `companies` (`id`, `slug`, `name`, `admin_password_hash`, `timezone`, `created_at`)
VALUES ('company_wl', 'wl', 'WL', '', 'Asia/Tokyo', 1750000000000);--> statement-breakpoint
ALTER TABLE `sites` ADD `company_id` text DEFAULT 'company_wl' NOT NULL;--> statement-breakpoint
ALTER TABLE `workers` ADD `company_id` text DEFAULT 'company_wl' NOT NULL;--> statement-breakpoint
ALTER TABLE `shifts` ADD `company_id` text DEFAULT 'company_wl' NOT NULL;
