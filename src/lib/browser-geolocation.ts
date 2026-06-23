/** Client-side geolocation fix in the shape the clock UI/API expect. */
export type BrowserGeoFix = { lat: number; lng: number; accuracy: number };

export type BrowserGeoError = "denied" | "unavailable" | "timeout";

const PERMISSION_DENIED = 1;

type PositionOptions = {
  enableHighAccuracy: boolean;
  timeout: number;
  maximumAge: number;
};

/**
 * Wrap getCurrentPosition with a manual timeout. iOS Safari often ignores the
 * API timeout option and may never call back when the request isn't tied to a
 * user gesture, which leaves the UI stuck on "Getting your location…".
 */
function getCurrentPosition(
  options: PositionOptions
): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("unavailable"));
      return;
    }

    const timeoutMs = options.timeout;
    let settled = false;

    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error("timeout"));
    }, timeoutMs + 1_000);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(pos);
      },
      (err) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(err);
      },
      options
    );
  });
}

function toFix(pos: GeolocationPosition): BrowserGeoFix {
  return {
    lat: pos.coords.latitude,
    lng: pos.coords.longitude,
    accuracy: pos.coords.accuracy,
  };
}

function classifyError(err: unknown): BrowserGeoError {
  if (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as GeolocationPositionError).code === PERMISSION_DENIED
  ) {
    return "denied";
  }
  if (err instanceof Error && err.message === "timeout") {
    return "timeout";
  }
  return "unavailable";
}

/**
 * Whether we can request location without a user gesture. iOS Safari blocks
 * prompt-on-load; already-granted permission is fine to auto-refresh.
 */
export async function canAutoRequestLocation(): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.permissions?.query) {
    return false;
  }
  try {
    const status = await navigator.permissions.query({ name: "geolocation" });
    return status.state === "granted";
  } catch {
    return false;
  }
}

/**
 * Request a GPS fix with iOS-friendly fallbacks: low-accuracy first (faster,
 * more reliable indoors), then high-accuracy if needed.
 */
export async function requestBrowserGeoFix(): Promise<BrowserGeoFix> {
  const attempts: PositionOptions[] = [
    { enableHighAccuracy: false, timeout: 10_000, maximumAge: 30_000 },
    { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
  ];

  let lastError: unknown;
  for (const options of attempts) {
    try {
      return toFix(await getCurrentPosition(options));
    } catch (err) {
      lastError = err;
      if (classifyError(err) === "denied") {
        throw err;
      }
    }
  }

  throw lastError ?? new Error("unavailable");
}

export { classifyError as classifyBrowserGeoError };
