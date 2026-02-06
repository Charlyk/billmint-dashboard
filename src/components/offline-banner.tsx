"use client";

import { WifiOff } from "lucide-react";
import { usePathname } from "next/navigation";
import { useOnlineStatus } from "@/lib/hooks";

export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const pathname = usePathname();

  // Hide on landing page or when online
  if (isOnline || pathname === "/") {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-2 bg-destructive px-4 py-2 text-sm text-white">
      <WifiOff className="size-4" />
      <span>You&apos;re offline. Some features may not work.</span>
    </div>
  );
}
