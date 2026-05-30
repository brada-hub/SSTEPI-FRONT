"use client";

import { useEffect, useState } from "react";

/**
 * Hook para monitorear el estado de conexión de red del navegador en caliente
 */
export function useOfflineStatus(): boolean {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    // Initial check
    setIsOffline(!window.navigator.onLine);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOffline;
}

export default useOfflineStatus;
