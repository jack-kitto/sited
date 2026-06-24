import { asc } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { getDb, workers } from "@/db";
import { readAdminSession } from "@/lib/auth";
import { getCompanyBySlug } from "@/lib/tenancy";
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
  const company = await getCompanyBySlug(slug);
  if (!company) notFound();

  const session = await readAdminSession();
  if (!session) redirect(`/${slug}/admin/login`);

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
