"use client";

import { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";

/**
 * Renders a Site Tag: a QR code encoding the absolute clock URL for a Site.
 * The same URL can also be written to an NFC tag. Printable via a minimal
 * print window so the tag can be physically posted at the Site.
 */
export function SiteTag({
  siteName,
  url,
}: {
  siteName: string;
  url: string;
}) {
  const qrRef = useRef<HTMLDivElement>(null);

  function print() {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    const win = window.open("", "_blank", "width=480,height=600");
    if (!win) return;
    win.document.write(`<!doctype html><html><head><title>Site Tag — ${siteName}</title>
<style>
  body { font-family: system-ui, sans-serif; display: flex; flex-direction: column;
         align-items: center; justify-content: center; gap: 16px; padding: 32px; }
  h1 { font-size: 20px; margin: 0; }
  .url { font-size: 12px; color: #555; word-break: break-all; text-align: center; max-width: 320px; }
  svg { width: 280px; height: 280px; }
</style></head><body>
  <h1>${siteName}</h1>
  ${svg.outerHTML}
  <div class="url">${url}</div>
  <script>window.onload = function(){ window.print(); }</script>
</body></html>`);
    win.document.close();
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div ref={qrRef} className="rounded-lg bg-white p-3">
        <QRCodeSVG value={url} size={148} marginSize={1} />
      </div>
      <p className="max-w-full text-center text-xs break-all text-muted-foreground">
        {url}
      </p>
      <Button variant="outline" size="sm" onClick={print}>
        Print Site Tag
      </Button>
      <p className="max-w-xs text-center text-xs text-muted-foreground">
        Write this same URL to an NFC tag to let workers tap instead of scan.
      </p>
    </div>
  );
}
