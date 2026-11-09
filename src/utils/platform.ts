"use client";

import { useEffect, useState } from "react";

export function getIsMac(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }
  const nav = navigator as any;
  if (nav.userAgentData?.platform) {
    return /mac/i.test(nav.userAgentData.platform);
  }
  return (
    /Mac|iPhone|iPod|iPad/i.test(navigator.platform) ||
    /Macintosh|Mac OS X/i.test(navigator.userAgent)
  );
}

export function useIsMac(): boolean {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(getIsMac());
  }, []);

  return isMac;
}

export function getModifierKey(): string {
  return getIsMac() ? "⌘" : "Ctrl";
}

export function useModifierKey(): string {
  const isMac = useIsMac();
  return isMac ? "⌘" : "Ctrl";
}
