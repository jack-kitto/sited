"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import type { Site } from "@/db";
import { SiteTag } from "./site-tag";

function clockUrl(origin: string, siteId: string): string {
  const base = origin || "";
  return `${base}/clock?site=${siteId}`;
}

export function SitesManager({
  sites,
  origin,
}: {
  sites: Site[];
  origin: string;
}) {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl font-semibold">Sites</h1>
          <p className="text-sm text-muted-foreground">
            Job sites and their Site Tags (QR / NFC) that open the clock page.
          </p>
        </div>
        <AddSiteDialog />
      </div>

      {sites.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          No sites yet. Add a site to generate its Site Tag.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sites.map((site) => (
            <Card key={site.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle>{site.name}</CardTitle>
                    <CardDescription>
                      {site.latitude.toFixed(5)}, {site.longitude.toFixed(5)} ·
                      radius {site.radiusM} m
                    </CardDescription>
                  </div>
                  <EditSiteDialog site={site} />
                </div>
              </CardHeader>
              <CardContent>
                <SiteTag
                  siteName={site.name}
                  url={clockUrl(origin, site.id)}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

type SiteFormValues = {
  name: string;
  latitude: string;
  longitude: string;
  radiusM: string;
};

function SiteFields({
  values,
  setValues,
  idPrefix,
}: {
  values: SiteFormValues;
  setValues: (v: SiteFormValues) => void;
  idPrefix: string;
}) {
  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${idPrefix}-name`}>Name</Label>
        <Input
          id={`${idPrefix}-name`}
          value={values.name}
          onChange={(e) => setValues({ ...values, name: e.target.value })}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${idPrefix}-lat`}>Latitude</Label>
          <Input
            id={`${idPrefix}-lat`}
            type="number"
            step="any"
            value={values.latitude}
            onChange={(e) => setValues({ ...values, latitude: e.target.value })}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${idPrefix}-lng`}>Longitude</Label>
          <Input
            id={`${idPrefix}-lng`}
            type="number"
            step="any"
            value={values.longitude}
            onChange={(e) => setValues({ ...values, longitude: e.target.value })}
            required
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${idPrefix}-radius`}>Radius (meters)</Label>
        <Input
          id={`${idPrefix}-radius`}
          type="number"
          min="1"
          step="1"
          value={values.radiusM}
          onChange={(e) => setValues({ ...values, radiusM: e.target.value })}
          required
        />
      </div>
    </div>
  );
}

function AddSiteDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [values, setValues] = useState<SiteFormValues>({
    name: "",
    latitude: "",
    longitude: "",
    radiusM: "100",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      const res = await fetch("/api/admin/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          latitude: values.latitude,
          longitude: values.longitude,
          radiusM: values.radiusM,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(data.error ?? "Failed to add site");
        return;
      }
      toast.success(`Added ${values.name}`);
      setValues({ name: "", latitude: "", longitude: "", radiusM: "100" });
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
        <Button size="sm">Add site</Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Add site</DialogTitle>
            <DialogDescription>
              Set the coordinates and geofence radius for this job site.
            </DialogDescription>
          </DialogHeader>
          <SiteFields values={values} setValues={setValues} idPrefix="new-site" />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending || !values.name}>
              {pending ? "Adding…" : "Add site"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditSiteDialog({ site }: { site: Site }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [values, setValues] = useState<SiteFormValues>({
    name: site.name,
    latitude: String(site.latitude),
    longitude: String(site.longitude),
    radiusM: String(site.radiusM),
  });

  function reset() {
    setValues({
      name: site.name,
      latitude: String(site.latitude),
      longitude: String(site.longitude),
      radiusM: String(site.radiusM),
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      const res = await fetch(`/api/admin/sites/${site.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          latitude: values.latitude,
          longitude: values.longitude,
          radiusM: values.radiusM,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(data.error ?? "Failed to update site");
        return;
      }
      toast.success("Site updated");
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
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Edit site</DialogTitle>
            <DialogDescription>
              Update the name, coordinates, or geofence radius.
            </DialogDescription>
          </DialogHeader>
          <SiteFields
            values={values}
            setValues={setValues}
            idPrefix={`edit-${site.id}`}
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending || !values.name}>
              {pending ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
