"use client";

import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/lib/hooks";

export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 bg-destructive px-4 py-2 text-sm text-destructive-foreground">
      <WifiOff className="size-4" />
      <span>You&apos;re offline. Some features may not work.</span>
    </div>
  );
}
