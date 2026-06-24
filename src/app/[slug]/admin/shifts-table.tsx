"use client";

import { useParams, useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { ShiftStatus } from "@/lib/types";
import type { ShiftRow } from "@/app/admin/_lib/shifts-query";
import {
  formatTs,
  formatDistance,
  formatDuration,
  workedMs,
} from "@/app/admin/_lib/format";
import { EditShiftDialog } from "./edit-shift-dialog";

function StatusBadge({ status }: { status: ShiftStatus }) {
  if (status === "incomplete") {
    return <Badge variant="destructive">Incomplete</Badge>;
  }
  if (status === "complete") {
    return <Badge variant="secondary">Complete</Badge>;
  }
  return <Badge variant="outline">Open</Badge>;
}

function DurationCell({ shift }: { shift: ShiftRow }) {
  const ms = workedMs(shift.clockInAt, shift.clockOutAt);
  if (ms == null) {
    return <span className="text-muted-foreground">—</span>;
  }
  if (shift.status === "incomplete") {
    // Worked Hours come from the 16:30 auto-close, not a real clock-out.
    return (
      <span title="Based on the 16:30 auto-close (Incomplete shift)">
        {formatDuration(ms)}
        <span className="text-muted-foreground"> *</span>
      </span>
    );
  }
  return <span>{formatDuration(ms)}</span>;
}

export function ShiftsTable({
  shifts,
  linkToWorker = true,
  linkQuery = "",
}: {
  shifts: ShiftRow[];
  /** When true, clicking a row opens that Worker's detail page. */
  linkToWorker?: boolean;
  /** Query string (without leading `?`) to carry onto the worker detail page. */
  linkQuery?: string;
}) {
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();

  if (shifts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
        No shifts match these filters.
      </div>
    );
  }

  function openWorker(workerId: string) {
    const qs = linkQuery ? `?${linkQuery}` : "";
    router.push(`/${slug}/admin/workers/${workerId}${qs}`);
  }

  return (
    <div className="rounded-xl ring-1 ring-foreground/10">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Worker</TableHead>
            <TableHead>Site</TableHead>
            <TableHead>Clock-in</TableHead>
            <TableHead>Clock-out</TableHead>
            <TableHead className="text-right">Duration</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">In distance</TableHead>
            <TableHead className="text-right">Out distance</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shifts.map((s) => (
            <TableRow
              key={s.id}
              onClick={linkToWorker ? () => openWorker(s.workerId) : undefined}
              className={[
                s.status === "incomplete" ? "bg-destructive/5" : "",
                linkToWorker ? "cursor-pointer" : "",
              ]
                .filter(Boolean)
                .join(" ") || undefined}
            >
              <TableCell className="font-medium">
                {s.workerName ?? s.workerId}
              </TableCell>
              <TableCell>{s.siteName ?? s.siteId}</TableCell>
              <TableCell>{formatTs(s.clockInAt)}</TableCell>
              <TableCell>{formatTs(s.clockOutAt)}</TableCell>
              <TableCell className="text-right tabular-nums">
                <DurationCell shift={s} />
              </TableCell>
              <TableCell>
                <StatusBadge status={s.status} />
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatDistance(s.clockInDistanceM)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatDistance(s.clockOutDistanceM)}
              </TableCell>
              <TableCell
                className="text-right"
                onClick={(e) => e.stopPropagation()}
              >
                <EditShiftDialog shift={s} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
