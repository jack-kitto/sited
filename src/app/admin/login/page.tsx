import { redirect } from "next/navigation";
import { readAdminSession } from "@/lib/auth";
import { LoginForm } from "./login-form";

// Reads the Cloudflare context (session secret) at request time, so it can't
// be statically prerendered.
export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  // Already authenticated admins skip the login screen.
  const session = await readAdminSession();
  if (session) redirect("/admin");

  return (
    <main className="flex flex-1 flex-col items-center justify-center p-6">
      <LoginForm />
    </main>
  );
}
