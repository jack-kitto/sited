"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  CheckCircle2Icon,
  LogInIcon,
  LogOutIcon,
  MapPinIcon,
  MapPinOffIcon,
  Loader2Icon,
  RefreshCwIcon,
  AlertTriangleIcon,
} from "lucide-react";

import {
  canAutoRequestLocation,
  classifyBrowserGeoError,
  getGeoRecoveryHint,
  getSafariLocationTip,
  isGeoSecureContext,
  isStandalonePWA,
  requestBrowserGeoFix,
  type BrowserGeoError,
  type BrowserGeoFix,
} from "@/lib/browser-geolocation";
import { COMPANY_TZ } from "@/lib/time";
import { formatDistance } from "@/lib/geo";
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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type PublicSite = { id: string; name: string };
type RosterEntry = { id: string; name: string };
type GeoFix = BrowserGeoFix;

type ClockResult = {
  action: "clocked_in" | "clocked_out";
  siteName: string;
  workerName: string;
  at: number;
  distanceM: number;
};

type SiteStatus = "loading" | "ready" | "error";
type SiteErrorKind = "not_found" | "none_nearby";
type NearestMiss = { name: string; distanceM: number };
type GeoStatus =
  | "idle"
  | "requesting"
  | "granted"
  | "denied"
  | "timeout"
  | "unavailable";

function formatTime(ms: number, timeZone: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(ms);
}

export function ClockClient({
  siteId,
  companySlug,
  companyTimeZone = null,
}: {
  siteId: string | null;
  // The Company this clock flow is scoped to. The slug-scoped page
  // (/{slug}/clock) passes it so the Roster and nearest-Site lookup only ever
  // see that Company's data (ADR-0004). The bare Site-Tag flow (/clock?site=)
  // has no slug here; deriving its Company from the Site is issue 0003.
  companySlug: string | null;
  // The scoped Company's IANA timezone, used only to DISPLAY clock times in
  // company-local terms (ADR-0006). The slug-scoped page passes it directly; the
  // Site-Tag flow learns it from the Site lookup below. Display-only — it never
  // drives calendar math, which is all server-side. Falls back to COMPANY_TZ
  // until a Company is resolved.
  companyTimeZone?: string | null;
}) {
  const [site, setSite] = React.useState<PublicSite | null>(null);
  const [siteStatus, setSiteStatus] = React.useState<SiteStatus>("loading");
  // The Company Slug the Site Tag flow (?site=) learns from the Site lookup
  // (ADR-0004). The slug-scoped page already knows it via `companySlug`; this
  // covers the no-slug-in-URL path so the Roster is still Company-scoped.
  const [siteCompanySlug, setSiteCompanySlug] = React.useState<string | null>(
    null
  );
  // The scoped Company's timezone the Site-Tag flow learns from the Site lookup,
  // mirroring `siteCompanySlug`. Used only for display formatting (ADR-0006).
  const [siteCompanyTimeZone, setSiteCompanyTimeZone] = React.useState<
    string | null
  >(null);
  // Why the site lookup failed: a bad Site Tag link vs. no site near the
  // worker's current location (the two need different copy + recovery).
  const [siteErrorKind, setSiteErrorKind] =
    React.useState<SiteErrorKind>("not_found");
  const [nearestMiss, setNearestMiss] = React.useState<NearestMiss | null>(null);
  // Whether the worker is confirmed within the resolved Site's geofence. `null`
  // until we've checked against a GPS fix. The nearest-Site flow only resolves a
  // Site when it's in range (so `true`); the Site-Tag flow verifies the fix
  // against the tagged Site server-side (see effect below) instead of claiming
  // "on site" just because a location was obtained.
  const [onSite, setOnSite] = React.useState<boolean | null>(null);

  const [roster, setRoster] = React.useState<RosterEntry[]>([]);

  const [geoStatus, setGeoStatus] = React.useState<GeoStatus>("idle");
  const [fix, setFix] = React.useState<GeoFix | null>(null);

  const [workerId, setWorkerId] = React.useState<string>("");
  const [pin, setPin] = React.useState<string>("");

  const [submitting, setSubmitting] = React.useState(false);
  const [result, setResult] = React.useState<ClockResult | null>(null);

  const geoRequestRef = React.useRef<Promise<BrowserGeoFix> | null>(null);

  // iOS Safari requires getCurrentPosition in the same synchronous turn as the
  // tap — keep this handler non-async and kick off the request immediately.
  const requestLocation = React.useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoStatus("unavailable");
      return;
    }
    if (!isGeoSecureContext()) {
      setFix(null);
      setGeoStatus("unavailable");
      return;
    }

    // Kick off geolocation before setState — Safari drops user activation if
    // anything (even a React update) runs between the tap and getCurrentPosition.
    const pending = requestBrowserGeoFix();
    geoRequestRef.current = pending;
    setGeoStatus("requesting");

    pending
      .then((nextFix) => {
        if (geoRequestRef.current !== pending) return;
        setFix(nextFix);
        setGeoStatus("granted");
      })
      .catch((err) => {
        if (geoRequestRef.current !== pending) return;
        setFix(null);
        const kind = classifyBrowserGeoError(err);
        if (kind === "denied") {
          setGeoStatus("denied");
        } else if (kind === "timeout") {
          setGeoStatus("timeout");
        } else {
          setGeoStatus("unavailable");
        }
      });
  }, []);

  // The Company this clock flow is scoped to: the slug-scoped page supplies it
  // directly; the Site Tag flow learns it from the Site lookup below. Either
  // way the Roster and nearest-Site lookups only ever see this Company's data.
  const effectiveSlug = companySlug ?? siteCompanySlug;

  // The timezone clock times are displayed in: the scoped Company's tz once
  // known (prop on the slug page, Site lookup on the Site-Tag flow), falling
  // back to COMPANY_TZ before then. Display-only (ADR-0006).
  const displayTimeZone =
    companyTimeZone ?? siteCompanyTimeZone ?? COMPANY_TZ;

  // Auto-request location once we know it won't surprise the worker — iOS
  // Safari blocks the prompt unless the call follows a tap, so we only do this
  // when permission is already granted.
  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      if (cancelled) return;
      if (await canAutoRequestLocation()) {
        requestLocation();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [requestLocation]);

  // Load the Roster once we know which Company this clock flow is scoped to
  // (ADR-0004). For the Site Tag flow that's after the Site lookup resolves the
  // Company; until then there's no slug, so we never fetch an unscoped Roster.
  React.useEffect(() => {
    if (!effectiveSlug) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(
          `/api/workers?company=${encodeURIComponent(effectiveSlug)}`
        );
        if (!res.ok) throw new Error("failed");
        const data = (await res.json()) as RosterEntry[];
        if (!cancelled) setRoster(data);
      } catch {
        if (!cancelled) {
          toast.error("Couldn't load the worker list. Please refresh.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [effectiveSlug]);

  // Resolve which Site this is: an explicit Site Tag link (?site=) wins;
  // otherwise we pick the Site from the worker's GPS fix once we have one.
  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      if (siteId) {
        // Site Tag flow: the tagged Site is fixed. Without a GPS fix yet we
        // fetch only metadata (name + Company) so the roster can load while the
        // worker shares location; once we have a fix we also ask the server
        // whether they're inside the Site's geofence, so we can tell them
        // they're too far up front instead of letting the punch fail (ADR-0002).
        try {
          const params = new URLSearchParams();
          if (fix) {
            params.set("lat", String(fix.lat));
            params.set("lng", String(fix.lng));
          }
          const qs = params.toString();
          const res = await fetch(
            `/api/sites/${encodeURIComponent(siteId)}${qs ? `?${qs}` : ""}`
          );
          if (!res.ok) throw new Error("not found");
          const data = (await res.json()) as PublicSite & {
            companySlug?: string;
            companyTimeZone?: string;
            distanceM?: number;
            withinRadius?: boolean;
          };
          if (cancelled) return;

          setSite({ id: data.id, name: data.name });
          // Infer the Company from the Site (ADR-0004): a Site Tag carries no
          // slug, so this is how the no-slug flow scopes its Roster and learns
          // the timezone to display clock times in (ADR-0006).
          if (data.companySlug) setSiteCompanySlug(data.companySlug);
          if (data.companyTimeZone) setSiteCompanyTimeZone(data.companyTimeZone);

          if (fix && data.withinRadius === false) {
            // Out of range: show the same "too far" card as the nearest flow,
            // not an "on site" form the server would only reject.
            setNearestMiss({ name: data.name, distanceM: data.distanceM ?? 0 });
            setSiteErrorKind("none_nearby");
            setOnSite(false);
            setSiteStatus("error");
            return;
          }

          setOnSite(fix ? data.withinRadius === true : null);
          setSiteStatus("ready");
        } catch {
          if (!cancelled) {
            setSiteErrorKind("not_found");
            setSiteStatus("error");
          }
        }
        return;
      }

      // Location-based: wait until we have a fix, then ask which site we're at.
      if (!fix) return;
      try {
        const nearestParams = new URLSearchParams({
          lat: String(fix.lat),
          lng: String(fix.lng),
        });
        // The GPS/nearest path only runs without a Site Tag, i.e. on the
        // slug-scoped page, so the Company is always the one from props here.
        if (companySlug) nearestParams.set("company", companySlug);
        const res = await fetch(`/api/sites/nearest?${nearestParams}`);
        const data = (await res.json()) as PublicSite & {
          error?: string;
          nearest?: NearestMiss;
        };
        if (cancelled) return;
        if (res.status === 404) {
          setNearestMiss(data.nearest ?? null);
          setSiteErrorKind("none_nearby");
          setOnSite(false);
          setSiteStatus("error");
          return;
        }
        if (!res.ok) throw new Error("failed");
        // nearest only ever returns a Site the worker is already within range of.
        setSite({ id: data.id, name: data.name });
        setOnSite(true);
        setSiteStatus("ready");
      } catch {
        if (!cancelled) {
          setNearestMiss(null);
          setSiteErrorKind("none_nearby");
          setSiteStatus("error");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [siteId, fix, companySlug]);

  const canSubmit =
    siteStatus === "ready" &&
    geoStatus === "granted" &&
    fix !== null &&
    // Only enable the punch once the worker is confirmed inside the geofence,
    // so the button never promises a clock-in the server will reject (ADR-0002).
    onSite === true &&
    workerId !== "" &&
    pin.length > 0 &&
    !submitting;

  async function handleSubmit() {
    if (!site || !fix || !canSubmit) return;
    setSubmitting(true);
    const toastId = toast.loading("Checking you in…");
    try {
      const res = await fetch("/api/clock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId: site.id,
          workerId,
          pin,
          fix,
        }),
      });
      const data = (await res.json()) as ClockResult & { error?: string };

      if (!res.ok) {
        toast.error(data.error ?? "Something went wrong.", { id: toastId });
        return;
      }

      setResult(data);
      setPin("");
      toast.success(
        data.action === "clocked_in"
          ? `Clocked in at ${formatTime(data.at, displayTimeZone)}`
          : `Clocked out at ${formatTime(data.at, displayTimeZone)}`,
        { id: toastId }
      );
    } catch {
      toast.error("Network error. Check your connection and try again.", {
        id: toastId,
      });
    } finally {
      setSubmitting(false);
    }
  }

  // ---- Success screen -----------------------------------------------------
  if (result) {
    const clockedIn = result.action === "clocked_in";
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <div
            className={`mx-auto mb-2 flex size-14 items-center justify-center rounded-full ${
              clockedIn
                ? "bg-success/15 text-success"
                : "bg-primary/10 text-primary"
            }`}
          >
            <CheckCircle2Icon className="size-8" />
          </div>
          <CardTitle className="text-xl">
            {clockedIn ? "Clocked in" : "Clocked out"}
          </CardTitle>
          <CardDescription>
            {result.workerName} · {result.siteName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Badge variant={clockedIn ? "success" : "secondary"}>
              {clockedIn ? (
                <LogInIcon className="size-3" />
              ) : (
                <LogOutIcon className="size-3" />
              )}
              {clockedIn ? "Clocked in" : "Clocked out"} at{" "}
              <span className="text-data">
                {formatTime(result.at, displayTimeZone)}
              </span>
            </Badge>
          </div>
          <p className="text-muted-foreground text-center text-sm">
            <span className="text-data">{formatDistance(result.distanceM)}</span>{" "}
            from {result.siteName}
          </p>
          <Button
            variant="outline"
            className="h-12 w-full text-base"
            onClick={() => {
              setResult(null);
              setWorkerId("");
              requestLocation();
            }}
          >
            Done
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ---- Invalid / missing Site --------------------------------------------
  if (siteStatus === "error") {
    const noneNearby = siteErrorKind === "none_nearby";
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <div className="mx-auto mb-2 flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            {noneNearby ? (
              <MapPinOffIcon className="size-8" />
            ) : (
              <AlertTriangleIcon className="size-8" />
            )}
          </div>
          <CardTitle className="text-xl">
            {noneNearby ? "No site nearby" : "Site not found"}
          </CardTitle>
          <CardDescription>
            {noneNearby
              ? nearestMiss
                ? `The closest site, ${nearestMiss.name}, is ${formatDistance(nearestMiss.distanceM)} away — too far to clock in. Move closer and retry.`
                : "You don't seem to be at any site. Move to your site and retry."
              : "This link isn't pointing at a valid Site. Scan the Site Tag again, or ask your admin for help."}
          </CardDescription>
        </CardHeader>
        {noneNearby && (
          <CardContent className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => {
                setSiteStatus("loading");
                setNearestMiss(null);
                setOnSite(null);
                requestLocation();
              }}
            >
              <RefreshCwIcon className="size-3.5" />
              Retry location
            </Button>
          </CardContent>
        )}
      </Card>
    );
  }

  // ---- Main clock flow ----------------------------------------------------
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPinIcon className="size-4" />
          <span className="text-xs font-medium tracking-wide uppercase">
            Clock in / out
          </span>
        </div>
        <CardTitle className="text-2xl">
          {siteStatus === "loading" ? (
            siteId || geoStatus !== "idle" ? (
              <Skeleton className="h-7 w-40" />
            ) : (
              "Find your site"
            )
          ) : (
            (site?.name ?? "")
          )}
        </CardTitle>
        <CardDescription>
          {siteStatus === "loading" && !siteId && geoStatus === "idle"
            ? "Share your location so we can find the site you're at."
            : "Confirm your identity and that you're on site."}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <LocationStatus
          status={geoStatus}
          fix={fix}
          onSite={onSite}
          onRetry={requestLocation}
        />

        <div className="space-y-2">
          <Label htmlFor="worker">Your name</Label>
          <Select
            value={workerId}
            onValueChange={setWorkerId}
            disabled={roster.length === 0}
          >
            <SelectTrigger
              id="worker"
              className="h-12 w-full text-base data-[size=default]:h-12"
            >
              <SelectValue
                placeholder={
                  roster.length === 0 ? "Loading roster…" : "Select your name"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {roster.map((w) => (
                <SelectItem key={w.id} value={w.id} className="py-2 text-base">
                  {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="pin">PIN</Label>
          <Input
            id="pin"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            placeholder="••••"
            className="text-data h-14 text-center text-2xl tracking-[0.5em]"
            value={pin}
            onChange={(e) =>
              setPin(e.target.value.replace(/\D/g, "").slice(0, 8))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" && canSubmit) handleSubmit();
            }}
          />
        </div>

        <Button
          className="h-14 w-full text-base font-semibold"
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          {submitting ? (
            <>
              <Loader2Icon className="size-5 animate-spin" />
              Working…
            </>
          ) : (
            "Clock in / out"
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          The app decides whether to clock you in or out automatically.
        </p>
      </CardContent>
    </Card>
  );
}

function LocationStatus({
  status,
  fix,
  onSite,
  onRetry,
}: {
  status: GeoStatus;
  fix: GeoFix | null;
  // null = location known but proximity not yet confirmed; true = within the
  // Site geofence; false is handled upstream (the worker sees a "too far" card).
  onSite: boolean | null;
  onRetry: () => void;
}) {
  const standalone = isStandalonePWA();
  if (status === "granted" && fix) {
    const confirmed = onSite === true;
    return (
      <div
        className={`flex items-center justify-between rounded-lg px-3 py-2 ${
          confirmed ? "bg-success/10" : "bg-muted/60"
        }`}
      >
        <span className="text-foreground flex items-center gap-2 text-sm font-medium">
          <MapPinIcon
            className={`size-4 ${confirmed ? "text-success" : "text-muted-foreground"}`}
          />
          {confirmed ? "On site" : "Checking you're on site…"}
        </span>
        <Badge variant="outline" className="text-data">
          ±{Math.round(fix.accuracy)}m
        </Badge>
      </div>
    );
  }

  if (status === "requesting") {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
        <Loader2Icon className="size-4 animate-spin" />
        Getting your location…
      </div>
    );
  }

  if (status === "idle") {
    const safariTip = getSafariLocationTip();
    return (
      <div className="space-y-2 rounded-lg bg-muted/60 px-3 py-3">
        <p className="text-sm text-muted-foreground">
          Tap below to share your location and confirm you&apos;re on site.
        </p>
        {safariTip ? (
          <p className="text-muted-foreground text-xs">{safariTip}</p>
        ) : null}
        <Button size="sm" className="w-full" onClick={onRetry}>
          <MapPinIcon className="size-3.5" />
          Share location
        </Button>
      </div>
    );
  }

  const errorKind: BrowserGeoError =
    status === "denied"
      ? "denied"
      : status === "timeout"
        ? "timeout"
        : "unavailable";

  return (
    <Alert variant="destructive">
      <MapPinOffIcon />
      <AlertTitle>
        {errorKind === "denied"
          ? "Location permission needed"
          : errorKind === "timeout"
            ? "Location timed out"
            : "Location unavailable"}
      </AlertTitle>
      <AlertDescription className="space-y-2">
        <span>
          {getGeoRecoveryHint({ error: errorKind, standalone })}
        </span>
        <Button
          size="sm"
          variant="outline"
          className="mt-1"
          onClick={onRetry}
        >
          <RefreshCwIcon className="size-3.5" />
          Retry location
        </Button>
      </AlertDescription>
    </Alert>
  );
}
