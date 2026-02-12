"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

export function DemoPreview() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = "/demo.gif";
    img.onload = () => setLoaded(true);
  }, []);

  return (
    <div className="relative rounded-xl bg-muted/50 aspect-video overflow-hidden">
      {/* Placeholder - shows instantly */}
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Clock className="mx-auto size-16 mb-4 opacity-50 animate-pulse" />
            <p className="text-lg font-medium">Loading demo...</p>
          </div>
        </div>
      )}

      {/* GIF - preloaded in background, fades in when ready */}
      {loaded && (
        <img
          src="/demo.gif"
          alt="BillMint app demo — time tracking, invoicing, and getting paid"
          className="size-full object-cover animate-in fade-in duration-500"
        />
      )}
    </div>
  );
}
