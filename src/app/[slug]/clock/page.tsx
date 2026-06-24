import { notFound } from "next/navigation";
import { getCompanyBySlug } from "@/lib/tenancy";
import { ClockClient } from "@/app/clock/clock-client";

// Resolves the Company from the path slug against D1 at request time, so it
// can't be statically prerendered.
export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<{ site?: string }>;

/**
 * Slug-scoped clock flow: `/{slug}/clock` (ADR-0004).
 *
 * Resolves the Company by its public Company Slug server-side and renders the
 * clock flow scoped to it. An unknown or malformed slug `notFound()`s — we never
 * crash and never fall through to another Company's data. The resolved slug is
 * handed to the client so the Roster and nearest-Site lookups only ever see this
 * Company's Workers and Sites.
 */
export default async function CompanyClockPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const { site } = await searchParams;

  const company = await getCompanyBySlug(slug);
  if (!company) notFound();

  return (
    <main className="flex flex-1 flex-col items-center justify-center p-4 sm:p-6">
      <ClockClient siteId={site ?? null} companySlug={company.slug} />
    </main>
  );
}
