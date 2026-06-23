import { defineConfig } from "drizzle-kit";

// Drizzle Kit config for Cloudflare D1 (SQLite dialect).
// `npm run db:generate` emits migration SQL into ./migrations, which is also
// the migrations_dir wrangler uses for `d1 migrations apply`.
export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./migrations",
  dialect: "sqlite",
});
