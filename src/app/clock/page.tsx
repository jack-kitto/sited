import { ClockClient } from "./clock-client";
import { CompanySlugPrompt } from "./company-slug-prompt";

type SearchParams = Promise<{ site?: string }>;

/**
 * Bare `/clock` (no Company Slug in the path). Two cases (ADR-0004):
 *   - `?site=<id>` — the Site Tag flow: the Site implies the Company, so we keep
 *     rendering the clock flow. (Deriving the Company from the Site to scope the
 *     Roster is issue 0003; here we just don't break it.)
 *   - no Site Tag — prompt the Worker for their Company Slug and send them to the
 *     scoped `/{slug}/clock`.
 */
export default async function ClockPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { site } = await searchParams;

  return (
    <main className="flex flex-1 flex-col items-center justify-center p-4 sm:p-6">
      {site ? (
        <ClockClient siteId={site} companySlug={null} />
      ) : (
        <CompanySlugPrompt />
      )}
    </main>
  );
}
