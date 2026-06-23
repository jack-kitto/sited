import { verifyAdminPassword, createAdminSession } from "@/lib/auth";

/**
 * POST /api/admin/login
 * Body: { password: string }
 * Verifies the single shared Admin password (ADR-0003) and, on success, sets
 * the signed session cookie.
 */
export async function POST(request: Request): Promise<Response> {
  let password = "";
  try {
    const body = (await request.json()) as { password?: unknown };
    if (typeof body.password === "string") password = body.password;
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!password) {
    return Response.json({ error: "Password is required" }, { status: 400 });
  }

  const ok = await verifyAdminPassword(password);
  if (!ok) {
    return Response.json({ error: "Incorrect password" }, { status: 401 });
  }

  await createAdminSession();
  return Response.json({ ok: true });
}
