"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Building2Icon, ArrowRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Bare `/clock` entry path for a Worker who has no Site Tag and no Company Slug
 * in the URL (ADR-0004). They type their Company Slug and we navigate to the
 * scoped `/{slug}/clock`; that page resolves the Company server-side and
 * `notFound()`s an unknown slug, so this prompt only needs to forward the
 * normalized value.
 */
export function CompanySlugPrompt() {
  const router = useRouter();
  const [slug, setSlug] = React.useState("");

  const normalized = slug.trim().toLowerCase();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!normalized) return;
    router.push(`/${encodeURIComponent(normalized)}/clock`);
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Building2Icon className="size-4" />
          <span className="text-xs font-medium tracking-wide uppercase">
            Clock in / out
          </span>
        </div>
        <CardTitle className="text-2xl">Find your company</CardTitle>
        <CardDescription>
          Enter your Company Slug to reach your clock-in page. If you have a Site
          Tag, scan it instead — it knows your company.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
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
              autoFocus
            />
          </div>
          <Button
            type="submit"
            className="h-12 w-full text-base font-semibold"
            disabled={!normalized}
          >
            Continue
            <ArrowRightIcon className="size-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
