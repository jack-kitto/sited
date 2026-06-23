import { destroyAdminSession } from "@/lib/auth";

/**
 * POST /api/admin/logout
 * Clears the Admin session cookie.
 */
export async function POST(): Promise<Response> {
  await destroyAdminSession();
  return Response.json({ ok: true });
}
