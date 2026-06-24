import { verifyCompanyAdminPassword, createAdminSession } from "@/lib/auth";
import { getCompanyBySlug } from "@/lib/tenancy";

/**
 * POST /api/admin/login
 * Body: { slug: string, password: string }
 *
 * Slug-scoped admin login (ADR-0004): resolve the Company by its Company Slug,
 * verify the password against THAT Company's stored hash, and on success set the
 * session cookie carrying the Company. A wrong slug, a locked Company, or a
 * wrong password all fail with the same 401 so one Company's password can never
 * authenticate another.
 */
export async function POST(request: Request): Promise<Response> {
  let slug = "";
  let password = "";
  try {
    const body = (await request.json()) as {
      slug?: unknown;
      password?: unknown;
    };
    if (typeof body.slug === "string") slug = body.slug;
    if (typeof body.password === "string") password = body.password;
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!slug) {
    return Response.json({ error: "Company is required" }, { status: 400 });
  }
  if (!password) {
    return Response.json({ error: "Password is required" }, { status: 400 });
  }

  const company = await getCompanyBySlug(slug);
  // Don't distinguish unknown Company from wrong password.
  const ok = company
    ? await verifyCompanyAdminPassword(company, password)
    : false;
  if (!company || !ok) {
    return Response.json({ error: "Incorrect password" }, { status: 401 });
  }

  await createAdminSession(company);
  return Response.json({ ok: true });
}
