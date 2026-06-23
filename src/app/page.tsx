import Link from "next/link";
import { ClockIcon, MapPinIcon, ShieldCheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-10 px-5 py-10">
      <div className="flex flex-col items-center text-center">
        <span
          aria-hidden
          className="bg-primary text-primary-foreground mb-5 flex size-14 items-center justify-center rounded-2xl shadow-sm"
        >
          <MapPinIcon className="size-7" strokeWidth={2.25} />
        </span>
        <h1 className="text-3xl font-semibold tracking-tight">Sited</h1>
        <p className="text-muted-foreground mt-2 text-balance">
          Clock in and out of your site. Sited finds your site from your
          location, takes your PIN, and confirms you&apos;re on site.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Button
          asChild
          className="h-14 w-full text-base font-semibold"
          size="lg"
        >
          <Link href="/clock">
            <ClockIcon className="size-5" />
            Clock in / out
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="h-12 w-full text-base"
          size="lg"
        >
          <Link href="/admin">
            <ShieldCheckIcon className="size-5" />
            Admin
          </Link>
        </Button>
      </div>

      <p className="text-muted-foreground text-center text-xs text-balance">
        For workers: tap{" "}
        <span className="text-foreground font-medium">Clock in / out</span>, or
        scan your Site Tag. Admins manage the roster, sites, and shifts.
      </p>
    </main>
  );
}
