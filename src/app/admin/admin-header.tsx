"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Shifts" },
  { href: "/admin/workers", label: "Workers" },
  { href: "/admin/sites", label: "Sites" },
] as const;

export function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();

  // The login screen lives under this layout but should not expose nav/logout.
  const onLogin = pathname === "/admin/login";

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <header className="flex items-center justify-between gap-4 border-b px-4 py-3 sm:px-6">
      <div className="flex items-center gap-6">
        <Link href="/admin" className="font-heading text-base font-semibold">
          Clock-In Admin
        </Link>
        {!onLogin && (
          <nav className="flex items-center gap-1">
            {NAV.map((item) => {
              const active =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);
              return (
                <Button
                  key={item.href}
                  asChild
                  variant="ghost"
                  size="sm"
                  className={cn(active && "bg-muted text-foreground")}
                >
                  <Link href={item.href}>{item.label}</Link>
                </Button>
              );
            })}
          </nav>
        )}
      </div>
      {!onLogin && (
        <Button variant="outline" size="sm" onClick={logout}>
          Log out
        </Button>
      )}
    </header>
  );
}
