import { notFound, redirect } from "next/navigation";
import { readAdminSession, type AdminSession } from "@/lib/auth";
import { getCompanyBySlug } from "@/lib/tenancy";
import type { Company } from "@/db";

/**
 * Guard for tenant-scoped admin Server Components (`/{slug}/admin/...`).
 *
 * Resolves the Company from the URL slug and the authenticated admin session,
 * then enforces that the session is scoped to THAT Company. The returned
 * `company.id` is what every page must filter its reads by — a missed predicate
 * is a cross-tenant data leak (ADR-0004).
 *
 * Behavior:
 * - Unknown slug -> `notFound()` (never reveal another Company exists).
 * - No session, or a session for a DIFFERENT Company -> redirect to this slug's
 *   login. An Admin for Company A visiting `/B/admin/...` is treated as "not
 *   authenticated for B", so B's data is never read or shown.
 */
export async function requireCompanyAdmin(
  slug: string
): Promise<{ company: Company; session: AdminSession }> {
  const company = await getCompanyBySlug(slug);
  if (!company) notFound();

  const session = await readAdminSession();
  if (!session || session.companyId !== company.id) {
    redirect(`/${slug}/admin/login`);
  }

  return { company, session };
}
