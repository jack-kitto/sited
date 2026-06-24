import type { MetadataRoute } from "next";

// Steel Blue brand hue, oklch(0.46 0.12 248) ≈ #2f5a8c (sRGB).
const STEEL = "#2f5a8c";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sited — Clock in & out",
    short_name: "Sited",
    description:
      "Clock in and out of your site. Sited finds your site from your location, takes your PIN, and confirms you're on site.",
    id: "/",
    // Multi-tenant (ADR-0004, issue 0008): one manifest is shared by every
    // Company, so the installed PWA cannot auto-scope to one. Launch lands on the
    // generic landing page, where the Worker types their Company Slug and we
    // route to `/{slug}/clock`. Site Tag deep links (`/clock?site=`) still open
    // a usable, Company-scoped clock flow because they fall within `scope: "/"`.
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: STEEL,
    categories: ["business", "productivity", "utilities"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
