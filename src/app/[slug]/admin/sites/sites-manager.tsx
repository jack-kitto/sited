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
                      {site.latitude.toFixed(6)}, {site.longitude.toFixed(6)}
                      <br />
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

/** Round a coordinate to ~0.1 m precision (6 decimals) for clean storage. */
function trimCoord(n: number): string {
  return n.toFixed(6);
}

function SiteFields({
  values,
  setValues,
  idPrefix,
}: {
  values: SiteFormValues;
  setValues: (v: SiteFormValues) => void;
  idPrefix: string;
}) {
  const [locating, setLocating] = useState(false);

  function useCurrentLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error("Location isn't available on this device.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setValues({
          ...values,
          latitude: trimCoord(pos.coords.latitude),
          longitude: trimCoord(pos.coords.longitude),
        });
        setLocating(false);
        toast.success("Filled in your current coordinates.");
      },
      () => {
        setLocating(false);
        toast.error("Couldn't get your location. Enter the coordinates manually.");
      },
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  }

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
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <Label>Location</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={useCurrentLocation}
            disabled={locating}
          >
            {locating ? "Locating…" : "Use my current location"}
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${idPrefix}-lat`} className="text-xs text-muted-foreground">
              Latitude
            </Label>
            <Input
              id={`${idPrefix}-lat`}
              type="number"
              step="any"
              inputMode="decimal"
              placeholder="35.689600"
              value={values.latitude}
              onChange={(e) => setValues({ ...values, latitude: e.target.value })}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${idPrefix}-lng`} className="text-xs text-muted-foreground">
              Longitude
            </Label>
            <Input
              id={`${idPrefix}-lng`}
              type="number"
              step="any"
              inputMode="decimal"
              placeholder="139.700600"
              value={values.longitude}
              onChange={(e) => setValues({ ...values, longitude: e.target.value })}
              required
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Decimal degrees (e.g. 35.689600, 139.700600). Stand at the site and tap
          “Use my current location”, or paste coordinates from a map. Six decimals
          ≈ 0.1 m.
        </p>
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
        <p className="text-xs text-muted-foreground">
          How close a worker must be to clock in. 100 m suits most sites.
        </p>
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

  async function remove() {
    if (
      !window.confirm(
        `Delete "${site.name}"? This can't be undone. Sites with recorded shifts can't be deleted.`
      )
    ) {
      return;
    }
    setPending(true);
    try {
      const res = await fetch(`/api/admin/sites/${site.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(data.error ?? "Failed to delete site");
        return;
      }
      toast.success(`Deleted ${site.name}`);
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
          <DialogFooter className="sm:justify-between">
            <Button
              type="button"
              variant="destructive"
              onClick={remove}
              disabled={pending}
            >
              Delete
            </Button>
            <div className="flex gap-2">
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
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
