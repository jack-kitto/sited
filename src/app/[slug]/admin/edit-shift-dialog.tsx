"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SHIFT_STATUSES, type ShiftStatus } from "@/lib/types";
import type { ShiftRow } from "@/app/admin/_lib/shifts-query";
import { msToLocalInput, localInputToMs } from "@/app/admin/_lib/time-input";

export function EditShiftDialog({
  shift,
  timeZone,
}: {
  shift: ShiftRow;
  /** The session Company's IANA timezone; edited times are in it (ADR-0004). */
  timeZone: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [clockIn, setClockIn] = useState(
    msToLocalInput(shift.clockInAt, timeZone)
  );
  const [clockOut, setClockOut] = useState(
    msToLocalInput(shift.clockOutAt, timeZone)
  );
  const [status, setStatus] = useState<ShiftStatus>(shift.status);
  const [pending, setPending] = useState(false);

  function reset() {
    setClockIn(msToLocalInput(shift.clockInAt, timeZone));
    setClockOut(msToLocalInput(shift.clockOutAt, timeZone));
    setStatus(shift.status);
  }

  async function save(override?: { status?: ShiftStatus }) {
    const nextStatus = override?.status ?? status;
    const clockInAt = localInputToMs(clockIn, timeZone);
    if (clockInAt == null) {
      toast.error("A valid clock-in time is required");
      return;
    }
    const clockOutAt = localInputToMs(clockOut, timeZone);

    setPending(true);
    try {
      const res = await fetch(`/api/admin/shifts/${shift.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clockInAt,
          clockOutAt,
          status: nextStatus,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(data.error ?? "Failed to update shift");
        return;
      }
      toast.success("Shift updated");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setPending(false);
    }
  }

  async function remove() {
    if (
      !window.confirm(
        "Delete this shift permanently? This can't be undone and removes it from totals and exports."
      )
    ) {
      return;
    }
    setPending(true);
    try {
      const res = await fetch(`/api/admin/shifts/${shift.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(data.error ?? "Failed to delete shift");
        return;
      }
      toast.success("Shift deleted");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit shift</DialogTitle>
          <DialogDescription>
            {(shift.workerName ?? shift.workerId)} ·{" "}
            {(shift.siteName ?? shift.siteId)}. Times are in company time (
            {timeZone}).
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {shift.status === "incomplete" && (
            <div className="flex items-center justify-between gap-3 rounded-lg bg-destructive/5 p-3 text-sm">
              <span className="text-muted-foreground">
                This shift was auto-closed and never finished by the worker.
              </span>
              <Button
                variant="default"
                size="sm"
                disabled={pending}
                onClick={() => {
                  setStatus("complete");
                  void save({ status: "complete" });
                }}
              >
                Resolve
              </Button>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor={`in-${shift.id}`}>Clock-in</Label>
            <Input
              id={`in-${shift.id}`}
              type="datetime-local"
              value={clockIn}
              onChange={(e) => setClockIn(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor={`out-${shift.id}`}>Clock-out</Label>
            <Input
              id={`out-${shift.id}`}
              type="datetime-local"
              value={clockOut}
              onChange={(e) => setClockOut(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Leave blank for an open shift.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor={`status-${shift.id}`}>Status</Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as ShiftStatus)}
            >
              <SelectTrigger id={`status-${shift.id}`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SHIFT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button variant="destructive" onClick={remove} disabled={pending}>
            Delete
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button onClick={() => save()} disabled={pending}>
              {pending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
