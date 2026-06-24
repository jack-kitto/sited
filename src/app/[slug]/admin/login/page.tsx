import { notFound, redirect } from "next/navigation";
import { readAdminSession } from "@/lib/auth";
import { getCompanyBySlug } from "@/lib/tenancy";
import { LoginForm } from "./login-form";

// Reads the Cloudflare context (session secret) at request time, so it can't
// be statically prerendered.
export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export default async function AdminLoginPage({ params }: { params: Params }) {
  const { slug } = await params;
  const company = await getCompanyBySlug(slug);
  if (!company) notFound();

  // Already authenticated admins skip the login screen.
  const session = await readAdminSession();
  if (session) redirect(`/${slug}/admin`);

  return (
    <main className="flex flex-1 flex-col items-center justify-center p-6">
      <LoginForm slug={company.slug} companyName={company.name} />
    </main>
  );
}
