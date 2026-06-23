/** Client-side geolocation fix in the shape the clock UI/API expect. */
export type BrowserGeoFix = { lat: number; lng: number; accuracy: number };

export type BrowserGeoError = "denied" | "unavailable" | "timeout";

const PERMISSION_DENIED = 1;

type PositionOptions = {
  enableHighAccuracy: boolean;
  timeout: number;
  maximumAge: number;
};

/** iPhone, iPad, and iOS PWAs (including iPadOS desktop UA). */
export function isIOSSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isClassicIOS = /iPad|iPhone|iPod/.test(ua);
  const isIPadOS =
    navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return isClassicIOS || isIPadOS;
}

/** Safari browser (not Chrome/Firefox/Edge on iOS or desktop). */
export function isSafariBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua)) return false;
  if (/Android/i.test(ua)) return false;
  if (/Chrome|Chromium|Edg\//i.test(ua)) return false;
  return /Safari/i.test(ua) || isIOSSafari();
}

/** Safari in a normal browser tab — not Chrome, not home-screen PWA. */
export function isSafariBrowserTab(): boolean {
  return isSafariBrowser() && !isStandalonePWA();
}

/** Installed home-screen PWA (display-mode: standalone). */
export function isStandalonePWA(): boolean {
  if (typeof window === "undefined") return false;
  // Legacy iOS Safari flag for Add to Home Screen.
  if (
    "standalone" in navigator &&
    (navigator as Navigator & { standalone?: boolean }).standalone
  ) {
    return true;
  }
  return window.matchMedia("(display-mode: standalone)").matches;
}

export function isGeoSecureContext(): boolean {
  return typeof window !== "undefined" && window.isSecureContext;
}

type GeoRecoveryContext = {
  error: BrowserGeoError;
  standalone: boolean;
};

/** Actionable copy when geolocation fails — tuned for iOS Safari quirks. */
export function getGeoRecoveryHint(ctx: GeoRecoveryContext): string {
  if (!isGeoSecureContext()) {
    return "Location only works over HTTPS. Open the secure link your admin shared, not a preview or local address.";
  }

  const safariTab = isSafariBrowserTab();

  if (ctx.error === "timeout" && safariTab) {
    return "Safari didn't respond to the location request. Tap aA in the address bar → Website Settings → Location → Allow, then retry. Or add Sited to your home screen — that often works when Safari doesn't.";
  }

  if (ctx.error === "timeout" && ctx.standalone && isIOSSafari()) {
    return "The home-screen app couldn't get a location fix in time. Move to an open area and retry, or open the site in Safari and allow location there first.";
  }

  if (ctx.error === "denied" && safariTab) {
    return "Safari blocked location for this site. Tap aA next to the address bar → Website Settings → Location → Allow. If it's already Allow, set it to Ask, reload, tap Share location, and allow when prompted.";
  }

  if (ctx.error === "denied" && ctx.standalone) {
    return "Location was blocked. Check Settings → Sited → Location, or open the site in Safari, tap aA → Website Settings → Location → Allow.";
  }

  if (ctx.error === "timeout") {
    return "Location took too long. Make sure Location Services are on, move to an open area, and retry.";
  }

  if (safariTab) {
    return "Safari couldn't get a GPS fix. Check aA → Website Settings → Location is set to Allow, or use the home-screen app instead.";
  }

  return "We couldn't get a GPS fix. Move to an open area with a clear sky view and retry — clock-in needs your location.";
}

/** Short hint shown before the user taps Share location in Safari. */
export function getSafariLocationTip(): string | null {
  if (!isSafariBrowserTab()) return null;
  return "Using Safari? If location fails, tap aA in the address bar → Website Settings → Location → Allow.";
}

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

/** watchPosition can succeed on iOS when getCurrentPosition hangs. */
function watchPositionOnce(
  options: PositionOptions
): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("unavailable"));
      return;
    }

    let settled = false;
    let watchId: number | undefined;

    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (watchId !== undefined) {
        navigator.geolocation.clearWatch(watchId);
      }
      fn();
    };

    const timer = window.setTimeout(() => {
      finish(() => reject(new Error("timeout")));
    }, options.timeout + 1_000);

    watchId = navigator.geolocation.watchPosition(
      (pos) => finish(() => resolve(pos)),
      (err) => finish(() => reject(err)),
      options
    );
  });
}

/** Safari in-tab often hangs on one API; race both from the same user tap. */
function raceGeoMethods(
  options: PositionOptions
): Promise<GeolocationPosition> {
  return Promise.race([
    getCurrentPosition(options),
    watchPositionOnce(options),
  ]);
}

async function requestPosition(
  options: PositionOptions
): Promise<GeolocationPosition> {
  if (isSafariBrowserTab()) {
    return raceGeoMethods(options);
  }

  try {
    return await getCurrentPosition(options);
  } catch (err) {
    if (isIOSSafari() && classifyError(err) !== "denied") {
      return watchPositionOnce(options);
    }
    throw err;
  }
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

function buildAttempts(): PositionOptions[] {
  const standalone = isStandalonePWA();

  // Safari tabs hang more on low-accuracy first; PWA/Chrome do better with low first.
  if (isSafariBrowserTab()) {
    return [
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
      { enableHighAccuracy: false, timeout: 12_000, maximumAge: 60_000 },
    ];
  }

  const lowTimeout = standalone ? 8_000 : 10_000;
  const highTimeout = standalone ? 12_000 : 15_000;

  return [
    { enableHighAccuracy: false, timeout: lowTimeout, maximumAge: 30_000 },
    { enableHighAccuracy: true, timeout: highTimeout, maximumAge: 0 },
  ];
}

/**
 * Whether we can request location without a user gesture. Safari masks
 * permission state and blocks gesture-less requests; Chrome/Firefox do not.
 */
export async function canAutoRequestLocation(): Promise<boolean> {
  if (isSafariBrowser()) return false;
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
 *
 * Must be invoked synchronously from a user click/tap handler on iOS — do not
 * await other work or call setState before this function.
 */
export async function requestBrowserGeoFix(): Promise<BrowserGeoFix> {
  if (!isGeoSecureContext()) {
    throw new Error("insecure");
  }

  const attempts = buildAttempts();

  let lastError: unknown;
  for (const options of attempts) {
    try {
      return toFix(await requestPosition(options));
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
