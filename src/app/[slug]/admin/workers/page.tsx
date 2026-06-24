import { asc, eq } from "drizzle-orm";
import { getDb, workers } from "@/db";
import { requireCompanyAdmin } from "@/app/admin/_lib/page-guard";
import { WorkersManager } from "./workers-manager";

// Reads cookies + the Cloudflare context at request time; never static.
export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export default async function AdminWorkersPage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;
  const { company } = await requireCompanyAdmin(slug);

  const db = getDb();
  const rows = await db
    .select({
      id: workers.id,
      name: workers.name,
      active: workers.active,
    })
    .from(workers)
    .where(eq(workers.companyId, company.id))
    .orderBy(asc(workers.name));

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 sm:p-6">
      <WorkersManager workers={rows} />
    </main>
  );
}
