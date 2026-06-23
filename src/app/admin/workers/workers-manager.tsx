"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Badge } from "@/components/ui/badge";

type WorkerRow = { id: string; name: string; active: boolean };

export function WorkersManager({ workers }: { workers: WorkerRow[] }) {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl font-semibold">Workers</h1>
          <p className="text-sm text-muted-foreground">
            The roster of workers permitted to clock in.
          </p>
        </div>
        <AddWorkerDialog />
      </div>

      {workers.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          No workers yet. Add the first worker to the roster.
        </div>
      ) : (
        <div className="rounded-xl ring-1 ring-foreground/10">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workers.map((w) => (
                <TableRow key={w.id}>
                  <TableCell className="font-medium">{w.name}</TableCell>
                  <TableCell>
                    {w.active ? (
                      <Badge variant="secondary">Active</Badge>
                    ) : (
                      <Badge variant="outline">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <EditWorkerDialog worker={w} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}

function AddWorkerDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      const res = await fetch("/api/admin/workers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, pin }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(data.error ?? "Failed to add worker");
        return;
      }
      toast.success(`Added ${name}`);
      setName("");
      setPin("");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Add worker</Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Add worker</DialogTitle>
            <DialogDescription>
              Add a worker to the roster with a personal PIN.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="new-worker-name">Name</Label>
              <Input
                id="new-worker-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="new-worker-pin">PIN</Label>
              <Input
                id="new-worker-pin"
                type="password"
                inputMode="numeric"
                autoComplete="off"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending || !name || !pin}>
              {pending ? "Adding…" : "Add worker"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditWorkerDialog({ worker }: { worker: WorkerRow }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(worker.name);
  const [pin, setPin] = useState("");
  const [pending, setPending] = useState(false);

  async function patch(
    payload: Record<string, unknown>,
    successMsg: string
  ): Promise<boolean> {
    setPending(true);
    try {
      const res = await fetch(`/api/admin/workers/${worker.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(data.error ?? "Failed to update worker");
        return false;
      }
      toast.success(successMsg);
      router.refresh();
      return true;
    } catch {
      toast.error("Network error — please try again");
      return false;
    } finally {
      setPending(false);
    }
  }

  async function saveDetails(e: React.FormEvent) {
    e.preventDefault();
    const payload: Record<string, unknown> = {};
    if (name.trim() && name.trim() !== worker.name) payload.name = name.trim();
    if (pin.trim()) payload.pin = pin.trim();
    if (Object.keys(payload).length === 0) {
      toast.info("Nothing to update");
      return;
    }
    const ok = await patch(payload, "Worker updated");
    if (ok) {
      setPin("");
      setOpen(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) {
          setName(worker.name);
          setPin("");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={saveDetails}>
          <DialogHeader>
            <DialogTitle>Edit worker</DialogTitle>
            <DialogDescription>
              Rename, reset the PIN, or change active status.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor={`name-${worker.id}`}>Name</Label>
              <Input
                id={`name-${worker.id}`}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`pin-${worker.id}`}>Reset PIN</Label>
              <Input
                id={`pin-${worker.id}`}
                type="password"
                inputMode="numeric"
                autoComplete="off"
                placeholder="Leave blank to keep current PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
              <div className="text-sm">
                <div className="font-medium">
                  {worker.active ? "Active" : "Inactive"}
                </div>
                <div className="text-muted-foreground">
                  {worker.active
                    ? "Worker can clock in."
                    : "Worker cannot clock in."}
                </div>
              </div>
              <Button
                type="button"
                variant={worker.active ? "destructive" : "default"}
                size="sm"
                disabled={pending}
                onClick={() =>
                  patch(
                    { active: !worker.active },
                    worker.active ? "Worker deactivated" : "Worker activated"
                  )
                }
              >
                {worker.active ? "Deactivate" : "Activate"}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
