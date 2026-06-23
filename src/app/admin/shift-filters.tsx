"use client";

import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SHIFT_STATUSES } from "@/lib/types";
import { presetRange, type DateRangePreset } from "@/lib/time";

const ALL = "all";

type SiteOption = { id: string; name: string };

type FilterState = {
  siteId: string | null;
  status: string | null;
  from: string | null;
  to: string | null;
};

const PRESETS: { id: DateRangePreset; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "this_week", label: "This week" },
  { id: "this_month", label: "This month" },
  { id: "last_month", label: "Last month" },
];

export function ShiftFilters({
  sites,
  siteId,
  status,
  from,
  to,
  basePath = "/admin",
}: {
  sites: SiteOption[];
  siteId: string | null;
  status: string | null;
  from: string | null;
  to: string | null;
  /** Where to push the updated query (so this works on worker detail pages too). */
  basePath?: string;
}) {
  const router = useRouter();

  function navigate(next: FilterState) {
    const params = new URLSearchParams();
    if (next.siteId) params.set("siteId", next.siteId);
    if (next.status) params.set("status", next.status);
    if (next.from) params.set("from", next.from);
    if (next.to) params.set("to", next.to);
    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
  }

  function apply(patch: Partial<FilterState>) {
    navigate({ siteId, status, from, to, ...patch });
  }

  const activePreset = PRESETS.find((p) => {
    const r = presetRange(p.id);
    return r.from === from && r.to === to;
  })?.id;

  const hasFilters = Boolean(siteId || status || from || to);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filter-site">Site</Label>
          <Select
            value={siteId ?? ALL}
            onValueChange={(v) => apply({ siteId: v === ALL ? null : v })}
          >
            <SelectTrigger id="filter-site" className="w-48">
              <SelectValue placeholder="All sites" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All sites</SelectItem>
              {sites.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filter-status">Status</Label>
          <Select
            value={status ?? ALL}
            onValueChange={(v) => apply({ status: v === ALL ? null : v })}
          >
            <SelectTrigger id="filter-status" className="w-40">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All statuses</SelectItem>
              {SHIFT_STATUSES.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filter-from">From</Label>
          <Input
            id="filter-from"
            type="date"
            value={from ?? ""}
            max={to ?? undefined}
            className="w-40"
            onChange={(e) => apply({ from: e.target.value || null })}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filter-to">To</Label>
          <Input
            id="filter-to"
            type="date"
            value={to ?? ""}
            min={from ?? undefined}
            className="w-40"
            onChange={(e) => apply({ to: e.target.value || null })}
          />
        </div>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => apply({ siteId: null, status: null, from: null, to: null })}
          >
            Clear filters
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">Quick range:</span>
        {PRESETS.map((p) => {
          const r = presetRange(p.id);
          return (
            <Button
              key={p.id}
              variant={activePreset === p.id ? "default" : "outline"}
              size="sm"
              onClick={() => apply({ from: r.from, to: r.to })}
            >
              {p.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
