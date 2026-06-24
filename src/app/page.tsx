import { MapPinIcon } from "lucide-react";
import { LandingEntry } from "./landing-entry";

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

      <LandingEntry />

      <p className="text-muted-foreground text-center text-xs text-balance">
        Enter your Company Slug to reach your company&apos;s clock-in or admin
        page. Workers with a{" "}
        <span className="text-foreground font-medium">Site Tag</span> can scan it
        instead — it knows your company.
      </p>
    </main>
  );
}
