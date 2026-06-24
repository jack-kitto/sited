import { Card, CardContent } from "@/components/ui/card";
import type { ShiftRow } from "@/app/admin/_lib/shifts-query";
import { formatDuration, workedMs } from "@/app/admin/_lib/format";

/**
 * Aggregate totals for the currently-filtered set of Shifts. Open shifts have
 * no Worked Hours and are excluded from the total (see CONTEXT.md).
 */
export function ShiftsSummary({ shifts }: { shifts: ShiftRow[] }) {
  let totalMs = 0;
  let complete = 0;
  let incomplete = 0;
  let open = 0;

  for (const s of shifts) {
    if (s.status === "complete") complete++;
    else if (s.status === "incomplete") incomplete++;
    else open++;
    const ms = workedMs(s.clockInAt, s.clockOutAt);
    if (ms != null) totalMs += ms;
  }

  const stats: { label: string; value: string; hint?: string }[] = [
    { label: "Total hours", value: formatDuration(shifts.length ? totalMs : 0) },
    { label: "Shifts", value: String(shifts.length) },
    {
      label: "Complete",
      value: String(complete),
    },
    {
      label: "Incomplete",
      value: String(incomplete),
      hint: incomplete ? "counted up to 16:30" : undefined,
    },
    {
      label: "Open",
      value: String(open),
      hint: open ? "excluded from hours" : undefined,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {stats.map((s) => (
        <Card key={s.label}>
          <CardContent className="flex flex-col gap-1 p-4">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {s.label}
            </span>
            <span className="text-2xl font-semibold tabular-nums">{s.value}</span>
            {s.hint ? (
              <span className="text-xs text-muted-foreground">{s.hint}</span>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
