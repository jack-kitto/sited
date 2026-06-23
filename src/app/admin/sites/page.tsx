import { asc } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDb, sites } from "@/db";
import { readAdminSession } from "@/lib/auth";
import { SitesManager } from "./sites-manager";

// Reads cookies + the Cloudflare context at request time; never static.
export const dynamic = "force-dynamic";

/** Best-effort absolute origin from the incoming request headers. */
async function getOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto =
    h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return host ? `${proto}://${host}` : "";
}

export default async function AdminSitesPage() {
  const session = await readAdminSession();
  if (!session) redirect("/admin/login");

  const db = getDb();
  const rows = await db.select().from(sites).orderBy(asc(sites.name));
  const origin = await getOrigin();

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 sm:p-6">
      <SitesManager sites={rows} origin={origin} />
    </main>
  );
}
