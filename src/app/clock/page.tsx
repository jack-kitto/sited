import { ClockClient } from "./clock-client";

type SearchParams = Promise<{ site?: string }>;

export default async function ClockPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { site } = await searchParams;

  return (
    <main className="flex flex-1 flex-col items-center justify-center p-4 sm:p-6">
      <ClockClient siteId={site ?? null} />
    </main>
  );
}
