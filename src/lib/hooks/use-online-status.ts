"use client";

import { useState, useEffect, useCallback } from "react";

interface UseOnlineStatusOptions {
  onOnline?: () => void;
  onOffline?: () => void;
}

export function useOnlineStatus(options?: UseOnlineStatusOptions) {
  const [isOnline, setIsOnline] = useState(true);

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    options?.onOnline?.();
  }, [options]);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    options?.onOffline?.();
  }, [options]);

  /* eslint-disable react-hooks/set-state-in-effect -- legitimate use for hydration safety */
  useEffect(() => {
    // Set initial state (only on client)
    if (typeof navigator !== "undefined") {
      setIsOnline(navigator.onLine);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [handleOnline, handleOffline]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return isOnline;
}
