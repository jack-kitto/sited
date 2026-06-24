import { asc, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { getDb, sites, workers } from "@/db";
import { readAdminSession } from "@/lib/auth";
import { getCompanyBySlug } from "@/lib/tenancy";
import { listShifts } from "@/app/admin/_lib/shifts-query";
import {
  buildShiftQueryString,
  resolveShiftQuery,
} from "@/app/admin/_lib/filters";
import { ShiftFilters } from "../../shift-filters";
import { ShiftsTable } from "../../shifts-table";
import { ShiftsSummary } from "../../shifts-summary";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Reads cookies + the Cloudflare context at request time; never static.
export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string; id: string }>;
type SearchParams = Promise<{
  siteId?: string;
  status?: string;
  from?: string;
  to?: string;
}>;

export default async function WorkerShiftsPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { slug, id } = await params;
  const company = await getCompanyBySlug(slug);
  if (!company) notFound();

  const session = await readAdminSession();
  if (!session) redirect(`/${slug}/admin/login`);

  const raw = await searchParams;

  const db = getDb();
  const [worker] = await db.select().from(workers).where(eq(workers.id, id)).limit(1);
  if (!worker) notFound();

  const siteList = await db.select().from(sites).orderBy(asc(sites.name));

  const query = resolveShiftQuery(raw, {
    validSiteIds: siteList.map((s) => s.id),
  });

  const shiftRows = await listShifts({
    workerId: id,
    siteId: query.siteId,
    status: query.status,
    fromMs: query.fromMs,
    toMsExclusive: query.toMsExclusive,
  });

  const basePath = `/${slug}/admin/workers/${id}`;
  const exportQs = buildShiftQueryString({
    workerId: id,
    siteId: query.siteId,
    status: query.status,
    from: query.range.from,
    to: query.range.to,
  });

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 sm:p-6">
      <Link
        href={`/${slug}/admin`}
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" /> All shifts
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading flex items-center gap-2 text-xl font-semibold">
            {worker.name}
            {!worker.active ? <Badge variant="outline">Inactive</Badge> : null}
          </h1>
          <p className="text-sm text-muted-foreground">
            Shifts from {query.range.from} to {query.range.to}.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <a href={`/api/admin/shifts/export?${exportQs}`}>Export CSV</a>
        </Button>
      </div>

      <ShiftFilters
        sites={siteList.map((s) => ({ id: s.id, name: s.name }))}
        siteId={query.siteId ?? null}
        status={query.status ?? null}
        from={query.range.from}
        to={query.range.to}
        basePath={basePath}
      />

      <ShiftsSummary shifts={shiftRows} />

      <ShiftsTable shifts={shiftRows} linkToWorker={false} />
    </main>
  );
}
