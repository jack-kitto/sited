import { requireCompanyAdmin } from "@/app/admin/_lib/page-guard";
import { SettingsForm } from "./settings-form";

// Reads cookies + the Cloudflare context at request time; never static.
export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export default async function AdminSettingsPage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;
  const { company } = await requireCompanyAdmin(slug);

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 sm:p-6">
      <SettingsForm
        slug={company.slug}
        name={company.name}
        timezone={company.timezone}
      />
    </main>
  );
}
