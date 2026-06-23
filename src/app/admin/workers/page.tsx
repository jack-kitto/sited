import { asc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb, workers } from "@/db";
import { readAdminSession } from "@/lib/auth";
import { WorkersManager } from "./workers-manager";

// Reads cookies + the Cloudflare context at request time; never static.
export const dynamic = "force-dynamic";

export default async function AdminWorkersPage() {
  const session = await readAdminSession();
  if (!session) redirect("/admin/login");

  const db = getDb();
  const rows = await db
    .select({
      id: workers.id,
      name: workers.name,
      active: workers.active,
    })
    .from(workers)
    .orderBy(asc(workers.name));

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 sm:p-6">
      <WorkersManager workers={rows} />
    </main>
  );
}
