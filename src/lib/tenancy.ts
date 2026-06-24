/**
 * Tenancy helpers (ADR-0004).
 */

import { eq } from "drizzle-orm";
import { companies, getDbAsync, type Company } from "@/db";

/**
 * Canonical Company Slug rule. MUST stay in sync with the Platform Operator
 * provisioning CLI (`scripts/provision-company.mjs`): 2-32 chars, lowercase
 * letters/digits/hyphens, no leading or trailing hyphen.
 */
const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,30}[a-z0-9])?$/;

/**
 * Normalize an untrusted slug from a URL: trim, lowercase, and validate against
 * the canonical slug rule. Returns the normalized slug, or `null` when it
 * doesn't pass the rule (callers should treat `null` as "no such Company").
 */
export function normalizeSlug(slug: string): string | null {
  const normalized = slug.trim().toLowerCase();
  return SLUG_RE.test(normalized) ? normalized : null;
}

/**
 * Resolve a Company by its public Company Slug, or `null` if the slug is
 * malformed or no Company owns it. Never throws on an unknown slug, so callers
 * can `notFound()` instead of leaking another Company's data.
 */
export async function getCompanyBySlug(slug: string): Promise<Company | null> {
  const normalized = normalizeSlug(slug);
  if (!normalized) return null;

  const db = await getDbAsync();
  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.slug, normalized))
    .limit(1);

  return company ?? null;
}

/**
 * Resolve a Company by its internal id, or `null` if none exists.
 */
export async function getCompanyById(id: string): Promise<Company | null> {
  const db = await getDbAsync();
  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.id, id))
    .limit(1);

  return company ?? null;
}
