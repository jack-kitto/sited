import { asc, eq } from "drizzle-orm";
import { getDb, sites } from "@/db";
import { requireCompanyAdmin } from "@/app/admin/_lib/page-guard";
import { listShifts } from "@/app/admin/_lib/shifts-query";
import {
  buildShiftQueryString,
  resolveShiftQuery,
} from "@/app/admin/_lib/filters";
import { ShiftFilters } from "./shift-filters";
import { ShiftsTable } from "./shifts-table";
import { ShiftsSummary } from "./shifts-summary";
import { Button } from "@/components/ui/button";

// Reads cookies + the Cloudflare context at request time; never static.
export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<{
  siteId?: string;
  status?: string;
  from?: string;
  to?: string;
}>;

export default async function AdminShiftsPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const { company } = await requireCompanyAdmin(slug);

  const raw = await searchParams;

  const db = getDb();
  const siteList = await db
    .select()
    .from(sites)
    .where(eq(sites.companyId, company.id))
    .orderBy(asc(sites.name));

  const query = resolveShiftQuery(raw, {
    validSiteIds: siteList.map((s) => s.id),
    defaultPreset: "today",
  });

  const shiftRows = await listShifts(company.id, {
    siteId: query.siteId,
    status: query.status,
    fromMs: query.fromMs,
    toMsExclusive: query.toMsExclusive,
  });

  const exportQs = buildShiftQueryString({
    siteId: query.siteId,
    status: query.status,
    from: query.range.from,
    to: query.range.to,
  });

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl font-semibold">Shifts</h1>
          <p className="text-sm text-muted-foreground">
            Review, edit, and resolve shifts. Click a row to see that worker&apos;s
            history. Showing {query.range.from} to {query.range.to}.
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
        basePath={`/${slug}/admin`}
      />

      <ShiftsSummary shifts={shiftRows} />

      <ShiftsTable shifts={shiftRows} linkToWorker linkQuery={exportQs} />
    </main>
  );
}
