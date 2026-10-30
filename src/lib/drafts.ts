"use client";

import * as React from "react";
import type { Person } from "./session";

/**
 * Saved drafts, kept in localStorage like submissions (src/lib/review.ts)
 * until there is a service to hold them.
 *
 * Every Save draft keeps a new version for its country — Draft 1, Draft 2 —
 * rather than overwriting the last, so earlier work can be gone back to. A
 * draft covers every step up to the one it was saved from.
 */

export interface Draft {
  id: string;
  code: string;
  name: string;
  /** 1, 2, 3… per country, in the order they were saved. */
  version: number;
  /** The step it was saved from, 0-based; it covers every step up to here. */
  step: number;
  savedBy: string;
  /** ISO timestamp. */
  savedAt: string;
}

const KEY = "fintua:drafts";
const EVENT = "fintua:drafts-change";

/* The snapshot handed to React must stay the same array until the store
   changes, or useSyncExternalStore re-renders without end. */
let cache: { raw: string | null; value: Draft[] } = { raw: null, value: [] };

function readAll(): Draft[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === cache.raw) return cache.value;
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    cache = { raw, value: Array.isArray(parsed) ? (parsed as Draft[]) : [] };
    return cache.value;
  } catch {
    return cache.value;
  }
}

/** Saves a new version of the country's draft and returns it. */
export function saveDraft(code: string, name: string, step: number, by: Person): Draft {
  const all = readAll();
  const key = code.toUpperCase();
  const version = Math.max(0, ...all.filter((d) => d.code === key).map((d) => d.version)) + 1;
  const draft: Draft = {
    id: `${key}-${version}-${Date.now()}`,
    code: key,
    name,
    version,
    step,
    savedBy: by.name,
    savedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(KEY, JSON.stringify([draft, ...all]));
  } catch {
    /* storage unavailable — the draft lasts until the page reloads. */
  }
  window.dispatchEvent(new Event(EVENT));
  return draft;
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

const NONE: Draft[] = [];

/** Every draft, newest first. */
export function useDrafts(): Draft[] {
  const all = React.useSyncExternalStore(subscribe, readAll, () => NONE);
  return React.useMemo(
    () => [...all].sort((a, b) => b.savedAt.localeCompare(a.savedAt)),
    [all],
  );
}
