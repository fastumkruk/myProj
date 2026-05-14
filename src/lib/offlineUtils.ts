export function isOfflineNow() {
  return typeof navigator !== "undefined" && !navigator.onLine;
}

export function isLikelyOfflineError(message: string) {
  const m = message.toLowerCase();
  return isOfflineNow() || m.includes("failed to fetch") || m.includes("network") || m.includes("fetch failed") || m.includes("load failed");
}

