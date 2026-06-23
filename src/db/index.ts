import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { schema } from "@/db/schema";

export type Db = DrizzleD1Database<typeof schema>;

/**
 * Returns a Drizzle client bound to the Cloudflare D1 binding (`env.DB`).
 *
 * Must be called inside a request (or scheduled) context — the D1 binding is
 * only available within the Worker runtime (ADR-0001). In Route Handlers and
 * Server Components this works during `next dev` too, thanks to
 * `initOpenNextCloudflareForDev()` in next.config.ts.
 */
export function getDb(): Db {
  const { env } = getCloudflareContext();
  return drizzle(env.DB, { schema });
}

/**
 * Async variant for contexts where the Cloudflare context must be awaited
 * (e.g. top-level in some Server Components). Prefer `getDb()` in handlers.
 */
export async function getDbAsync(): Promise<Db> {
  const { env } = await getCloudflareContext({ async: true });
  return drizzle(env.DB, { schema });
}

export { schema };
export * from "@/db/schema";
