import { eq } from "drizzle-orm";
import { companies, getDb, type Company } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { hashPin } from "@/lib/pin";

type PatchBody = {
  name?: unknown;
  timezone?: unknown;
  password?: unknown;
};

/**
 * Validate an IANA timezone the same way the provisioning CLI does
 * (scripts/provision-company.mjs): an invalid name throws from
 * Intl.DateTimeFormat.
 */
function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** Drop the secret hash before returning a Company to the client. */
function publicCompany(company: Company) {
  return {
    id: company.id,
    slug: company.slug,
    name: company.name,
    timezone: company.timezone,
    createdAt: company.createdAt,
  };
}

/**
 * PATCH /api/admin/company
 *
 * Admin self-service Company settings (ADR-0004, issue 0007). Updates ONLY the
 * session's own Company (`eq(companies.id, session.companyId)`); any
 * client-supplied id/slug is ignored, and the Company Slug is immutable. The
 * response never includes the admin password hash.
 *
 * Body: { name?, timezone?, password? }
 * - name: non-empty after trim.
 * - timezone: valid IANA name (validated like the CLI).
 * - password: optional; an empty/omitted value leaves the password unchanged.
 *   When provided it must be >= 8 chars and is stored hashed via `hashPin`.
 */
export async function PATCH(request: Request): Promise<Response> {
  const session = await requireAdmin();
  if (!session) return new Response("Unauthorized", { status: 401 });

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const updates: {
    name?: string;
    timezone?: string;
    adminPasswordHash?: string;
  } = {};

  if (body.name !== undefined) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return Response.json({ error: "Name cannot be empty" }, { status: 400 });
    }
    updates.name = name;
  }

  if (body.timezone !== undefined) {
    const timezone =
      typeof body.timezone === "string" ? body.timezone.trim() : "";
    if (!timezone || !isValidTimezone(timezone)) {
      return Response.json(
        { error: 'Invalid timezone. Use an IANA name like "Asia/Tokyo".' },
        { status: 400 }
      );
    }
    updates.timezone = timezone;
  }

  // An empty/omitted password means "leave unchanged" — only re-hash a new one.
  if (typeof body.password === "string" && body.password !== "") {
    if (body.password.length < 8) {
      return Response.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }
    updates.adminPasswordHash = await hashPin(body.password);
  }

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: "No fields to update" }, { status: 400 });
  }

  // Scope the UPDATE to the session Company so settings can never mutate another
  // Company. The slug is intentionally never written (immutable).
  const db = getDb();
  const updated = await db
    .update(companies)
    .set(updates)
    .where(eq(companies.id, session.companyId))
    .returning();

  if (updated.length === 0) {
    return Response.json({ error: "Company not found" }, { status: 404 });
  }

  return Response.json({ company: publicCompany(updated[0]) });
}
