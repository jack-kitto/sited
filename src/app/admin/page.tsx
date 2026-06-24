import { AdminSlugPrompt } from "./admin-slug-prompt";

/**
 * Bare `/admin` (no Company Slug in the path). The static `admin` folder takes
 * precedence over the `[slug]` segment, so this prompt resolves here and asks
 * the Admin for their Company Slug, then forwards them to `/{slug}/admin`
 * (ADR-0004). There is no layout at this segment, so no admin nav/header/logout
 * appears — the Admin isn't scoped to a Company yet.
 */
export default function AdminSlugEntryPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center p-4 sm:p-6">
      <AdminSlugPrompt />
    </main>
  );
}
