"use client";

import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();

  const base = `/${slug}/admin`;
  const nav = [
    { href: base, label: "Shifts" },
    { href: `${base}/workers`, label: "Workers" },
    { href: `${base}/sites`, label: "Sites" },
  ];

  // The login screen lives under this layout but should not expose nav/logout.
  const onLogin = pathname === `${base}/login`;

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace(`${base}/login`);
    router.refresh();
  }

  return (
    <header className="flex items-center justify-between gap-4 border-b px-4 py-3 sm:px-6">
      <div className="flex items-center gap-6">
        <Link href={base} className="font-heading text-base font-semibold">
          Clock-In Admin
        </Link>
        {!onLogin && (
          <nav className="flex items-center gap-1">
            {nav.map((item) => {
              const active =
                item.href === base
                  ? pathname === base
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
