"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ClockIcon, ShieldCheckIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Landing-page Company Slug entry (ADR-0004, issue 0008). `/` is a generic
 * landing page shared by every Company, so it cannot auto-scope to one. A Worker
 * or Admin types their Company Slug here and we navigate to the scoped
 * `/{slug}/clock` or `/{slug}/admin`; those pages resolve the Company
 * server-side and `notFound()` an unknown slug, so this only forwards the
 * normalized value. Workers with a Site Tag skip this entirely — the tag deep
 * link (`/clock?site=`) implies the Company.
 */
export function LandingEntry() {
  const router = useRouter();
  const [slug, setSlug] = React.useState("");

  const normalized = slug.trim().toLowerCase();
  const disabled = !normalized;

  function go(section: "clock" | "admin") {
    if (!normalized) return;
    router.push(`/${encodeURIComponent(normalized)}/${section}`);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    go("clock");
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <div className="space-y-2">
        <Label htmlFor="company-slug">Company Slug</Label>
        <Input
          id="company-slug"
          name="company-slug"
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          inputMode="text"
          placeholder="e.g. acme"
          className="h-12 text-base"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
        />
      </div>
      <Button
        type="submit"
        className="h-14 w-full text-base font-semibold"
        size="lg"
        disabled={disabled}
      >
        <ClockIcon className="size-5" />
        Clock in / out
      </Button>
      <Button
        type="button"
        variant="outline"
        className="h-12 w-full text-base"
        size="lg"
        disabled={disabled}
        onClick={() => go("admin")}
      >
        <ShieldCheckIcon className="size-5" />
        Admin
      </Button>
    </form>
  );
}
