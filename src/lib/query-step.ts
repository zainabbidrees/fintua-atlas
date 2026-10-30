"use client";

import * as React from "react";
import { RETURN_BOXES } from "./mock/return-boxes";
import { VIES_BOXES } from "./mock/vies-spec";

/**
 * Whether a country onboards with Query Builder, step 6. The step exists only
 * when at least one box in its field map has is_calculated ticked — without
 * a calculated box there is no query to build, and Tax Rules Generation is
 * the last step.
 *
 * Form Annotations & Box Mapping records the answer as the expert ticks and
 * unticks; until it has, the fixtures decide. Kept in localStorage like the
 * other stores until there is a service.
 */

const KEY = "fintua:calculated";
const EVENT = "fintua:calculated-change";

/** What the fixture workbooks say, for a country step four has not opened. */
const FIXTURE = [...RETURN_BOXES, ...VIES_BOXES].some((row) => row.is_calculated === "TRUE");

let cache: { raw: string | null; value: Record<string, boolean> } = { raw: null, value: {} };

function readAll(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === cache.raw) return cache.value;
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    cache = {
      raw,
      value: parsed && typeof parsed === "object" ? (parsed as Record<string, boolean>) : {},
    };
    return cache.value;
  } catch {
    return cache.value;
  }
}

/** Whether the country has Query Builder, read now (client only). */
export function hasQueryStep(code: string): boolean {
  return readAll()[code.toUpperCase()] ?? FIXTURE;
}

/** Records whether any of the country's boxes is calculated. */
export function setHasQueryStep(code: string, value: boolean) {
  const all = readAll();
  const key = code.toUpperCase();
  if (all[key] === value) return;
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...all, [key]: value }));
  } catch {
    /* storage unavailable — the fixtures decide again on reload. */
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

/** Whether the country has Query Builder, kept current. The server renders it
    as the fixtures say. */
export function useHasQueryStep(code: string): boolean {
  return React.useSyncExternalStore(
    subscribe,
    () => (code ? hasQueryStep(code) : FIXTURE),
    () => FIXTURE,
  );
}
