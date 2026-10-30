"use client";

import * as React from "react";
import type { Person } from "./session";

/**
 * Alerts to the developer, raised when a tax expert adds a column to a tax-rule
 * sheet. A new column is a change to what Comply stores, so it needs a
 * developer before it can be used — the expert's edit alone does not reach the
 * database.
 *
 * Each alert reaches the developer two ways: an email to the development inbox,
 * and a row in the in-app Developer alerts list, where it stays until a
 * developer marks the column added. Each carries what a developer needs to act
 * on it without asking — where, which column, its default value, and who added
 * it when.
 *
 * Kept in localStorage like the approvals (src/lib/review.ts) until there is a
 * service to deliver them: the email is composed and recorded, not sent.
 */

/** Where the email goes. A stand-in until Comply names the real inbox. */
export const DEVELOPER_INBOX = "comply-dev@fintua.com";

export interface DeveloperAlert {
  id: string;
  /** Country code, e.g. "BE". */
  country: string;
  countryName: string;
  /** The sheet as its tab reads, e.g. "Sales". */
  sheet: string;
  column: string;
  /** The column's letter in the sheet. */
  letter: string;
  /** The value every existing row was given; blank when none. */
  value: string;
  /** What the column holds, as the expert chose it, e.g. "Decimal". */
  type?: string;
  by: string;
  /** ISO timestamp. */
  at: string;
  /** The inbox the email went to. */
  emailedTo: string;
  /** Set once a developer has added the column to Comply. */
  doneBy?: string;
  doneAt?: string;
  /** Set when the expert deleted the column before publishing: no longer
      wanted, so there is nothing for the developer to do. */
  withdrawnBy?: string;
  withdrawnAt?: string;
}

const KEY = "fintua:developer-alerts";
const EVENT = "fintua:developer-alerts-change";

/* The snapshot handed to React must stay the same array until the store
   changes, or useSyncExternalStore re-renders without end. */
let cache: { raw: string | null; value: DeveloperAlert[] } = { raw: null, value: [] };

function readAll(): DeveloperAlert[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === cache.raw) return cache.value;
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    cache = { raw, value: Array.isArray(parsed) ? (parsed as DeveloperAlert[]) : [] };
    return cache.value;
  } catch {
    return cache.value;
  }
}

function writeAll(all: DeveloperAlert[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* storage unavailable — the alert is shown, but not kept. */
  }
  window.dispatchEvent(new Event(EVENT));
}

/** Records an alert for the developer about a column just added, and the
    email that goes with it. */
export function alertDeveloper(
  alert: Omit<
    DeveloperAlert,
    "id" | "by" | "at" | "emailedTo" | "doneBy" | "doneAt" | "withdrawnBy" | "withdrawnAt"
  >,
  person: Person,
): DeveloperAlert {
  const full: DeveloperAlert = {
    ...alert,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    by: person.name,
    at: new Date().toISOString(),
    emailedTo: DEVELOPER_INBOX,
  };
  writeAll([...readAll(), full]);
  return full;
}

/** The expert deleted the column, so its open alert is withdrawn. Returns the
    alert's id, so an undo can reopen it. */
export function withdrawAlert(
  where: { country: string; sheet: string; column: string },
  person: Person,
): string | null {
  const open = [...readAll()]
    .reverse()
    .find(
      (a) =>
        a.country === where.country &&
        a.sheet === where.sheet &&
        a.column === where.column &&
        !a.withdrawnAt &&
        !a.doneAt,
    );
  if (!open) return null;
  writeAll(
    readAll().map((a) =>
      a.id === open.id ? { ...a, withdrawnBy: person.name, withdrawnAt: new Date().toISOString() } : a,
    ),
  );
  return open.id;
}

/** Reopens a withdrawn alert — the undo of deleting its column. */
export function reopenAlert(id: string) {
  writeAll(
    readAll().map((a) =>
      a.id === id ? { ...a, withdrawnBy: undefined, withdrawnAt: undefined } : a,
    ),
  );
}

/** A developer has added the column to Comply. */
export function markAlertDone(id: string, person: Person) {
  writeAll(
    readAll().map((a) =>
      a.id === id ? { ...a, doneBy: person.name, doneAt: new Date().toISOString() } : a,
    ),
  );
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

const NONE: DeveloperAlert[] = [];

/** Every alert still standing, newest first. One withdrawn because its column
    was deleted is left out: there is nothing in it for a developer to do. */
export function useDeveloperAlerts(): DeveloperAlert[] {
  const all = React.useSyncExternalStore(subscribe, readAll, () => NONE);
  return React.useMemo(
    () => all.filter((a) => !a.withdrawnAt).sort((a, b) => b.at.localeCompare(a.at)),
    [all],
  );
}
