/**
 * Which return types step two carries forward — the expert's own selection on
 * the Return Types table, read back by the later steps so a return type dropped
 * there never appears in Tax Form Retrieval or Tax Rules.
 *
 * This is the step-two counterpart of step one's `fintua:carried` (which narrows
 * step two itself); it is kept under its own key so the two never clobber each
 * other. Stored as the return types' obligation ids — the unit the later steps
 * key on — so dropping one schedule of a return type that still has another kept
 * leaves the return type carried.
 *
 * Reads are guarded for the server, where there is no `localStorage`: both
 * helpers no-op there, and a reader narrows after mount (as `useReturns` does)
 * so the first client render still matches the server's.
 */
const KEY = "fintua:returns";

export function writeReturnsCarried(countryCode: string, returnTypeIds: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${KEY}:${countryCode}`, JSON.stringify(returnTypeIds));
  } catch {
    /* A private window or blocked storage just means no narrowing downstream. */
  }
}

/** The carried set, or null when nothing was recorded — in which case the later
    steps show every return type, exactly as before this selection existed. */
export function readReturnsCarried(countryCode: string): Set<string> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${KEY}:${countryCode}`);
    const list = raw ? JSON.parse(raw) : null;
    return Array.isArray(list) && list.length ? new Set(list as string[]) : null;
  } catch {
    return null;
  }
}
