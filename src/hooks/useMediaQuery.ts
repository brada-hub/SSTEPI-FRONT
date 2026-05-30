"use client";

import { useEffect, useState } from "react";

/**
 * Hook reactivo para evaluar media queries en tiempo real
 * @param query La query CSS a evaluar (ej: "(max-width: 768px)")
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [matches, query]);

  return matches;
}

export default useMediaQuery;
