"use client";

import * as React from "react";

/**
 * The field map as step four last saved it, per country and return type, so
 * the steps after it — Query Builder above all — build from the expert's
 * boxes rather than the extracted ones. A country step four has not saved
 * reads as null, and the fixtures stand in.
 *
 * Kept in localStorage like the other stores until there is a service.
 */

export type FieldMapRow = Partial<Record<string, string>>;
type Store = Record<string, Record<string, FieldMapRow[]>>;

const KEY = "fintua:field-map";
const EVENT = "fintua:field-map-change";

/* The snapshot handed to React must stay the same object until the store
   changes, or useSyncExternalStore re-renders without end. */
let cache: { raw: string | null; value: Store } = { raw: null, value: {} };

function readAll(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === cache.raw) return cache.value;
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    cache = { raw, value: parsed && typeof parsed === "object" ? (parsed as Store) : {} };
    return cache.value;
  } catch {
    return cache.value;
  }
}

/** Records the country's saved boxes, keyed by return type. */
export function writeFieldMap(code: string, boxes: Record<string, FieldMapRow[]>) {
  const all = readAll();
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...all, [code.toUpperCase()]: boxes }));
  } catch {
    /* storage unavailable — later steps fall back to the fixtures. */
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** Every return type's boxes step four saved for the country, or null. */
export function useSavedFieldMaps(code: string): Record<string, FieldMapRow[]> | null {
  return React.useSyncExternalStore(
    subscribe,
    () => readAll()[code.toUpperCase()] ?? null,
    () => null,
  );
}

/** The boxes step four saved for one return type, or null where it has not
    saved — and on the server, which has no storage. */
export function useFieldMap(code: string, returnType: string): FieldMapRow[] | null {
  return React.useSyncExternalStore(
    subscribe,
    () => readAll()[code.toUpperCase()]?.[returnType] ?? null,
    () => null,
  );
}
