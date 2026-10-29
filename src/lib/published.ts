/**
 * Countries published from the Query Builder in this browser.
 *
 * There is no backend yet, so publishing is recorded in localStorage, the same
 * way step one hands its carried return types to step two. The country list
 * reads it to show the country as published, and the country picker reads it
 * so a published country cannot be started again. A service call replaces this
 * file when there is one.
 */

const KEY = "fintua:published";

export interface PublishedCountry {
  code: string;
  name: string;
  /** ISO timestamp of the publish. */
  at: string;
}

export function readPublished(): PublishedCountry[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as PublishedCountry[]) : [];
  } catch {
    return [];
  }
}

/** Records a publish; a country published again moves to the front. */
export function markPublished(code: string, name: string) {
  const entry: PublishedCountry = { code: code.toUpperCase(), name, at: new Date().toISOString() };
  const rest = readPublished().filter((p) => p.code !== entry.code);
  try {
    localStorage.setItem(KEY, JSON.stringify([entry, ...rest]));
  } catch {
    /* storage unavailable — the list then shows the fixtures alone. */
  }
}
