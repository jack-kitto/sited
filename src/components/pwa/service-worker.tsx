"use client";

import * as React from "react";

/**
 * Registers the offline service worker. Render once near the document root.
 * Registration is best-effort: the app works without it, but installing the
 * worker is what makes Sited installable and resilient on flaky site signal.
 */
export function ServiceWorker() {
  React.useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .catch(() => {
          // Non-fatal: the app still works, just without offline caching.
        });
    };

    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
