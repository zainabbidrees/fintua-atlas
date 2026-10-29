"use client";

import * as React from "react";
import type { Person, Role } from "./session";

/**
 * Submissions for approval, one per country, kept in localStorage like the
 * published list (src/lib/published.ts) until there is a service to hold them.
 *
 * Every one of the six steps is reviewed on its own: approved, sent back with
 * changes requested, or waiting. A step the expert edits and sends again goes
 * back to waiting, marked as resubmitted, so the reviewer knows to look again.
 * Each step keeps its own thread of comments and decisions — the record the
 * audit trail is made of.
 */

export type StepStatus = "waiting" | "approved" | "changes";

export interface ReviewEntry {
  id: string;
  author: string;
  role: Role;
  /** A plain comment, or the decision it records. */
  kind: "comment" | "approved" | "changes" | "resubmitted";
  text: string;
  /** ISO timestamp. */
  at: string;
}

export interface StepReview {
  status: StepStatus;
  /** Sent again by the expert after changes were asked for. */
  resubmitted: boolean;
  entries: ReviewEntry[];
}

export interface Submission {
  code: string;
  name: string;
  submittedBy: string;
  submittedAt: string;
  steps: StepReview[];
}

export const STEP_COUNT = 6;

const KEY = "fintua:reviews";
const EVENT = "fintua:reviews-change";

/* The snapshot handed to React must stay the same object until the store
   changes, or useSyncExternalStore re-renders without end. */
let cache: { raw: string | null; value: Record<string, Submission> } = { raw: null, value: {} };

function readAll(): Record<string, Submission> {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === cache.raw) return cache.value;
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    const value =
      parsed && typeof parsed === "object" ? (parsed as Record<string, Submission>) : {};
    cache = { raw, value };
    return value;
  } catch {
    return cache.value;
  }
}

function writeAll(all: Record<string, Submission>) {
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* storage unavailable — the submission lasts until the page reloads. */
  }
  window.dispatchEvent(new Event(EVENT));
}

function update(code: string, change: (s: Submission) => Submission) {
  const all = readAll();
  const current = all[code.toUpperCase()];
  if (!current) return;
  writeAll({ ...all, [current.code]: change(current) });
}

let seq = 0;
function entry(person: Person, kind: ReviewEntry["kind"], text: string): ReviewEntry {
  return {
    id: `${Date.now()}-${seq++}`,
    author: person.name,
    role: person.role,
    kind,
    text,
    at: new Date().toISOString(),
  };
}

const freshStep = (): StepReview => ({ status: "waiting", resubmitted: false, entries: [] });

/**
 * Sends every step for approval, from the last step. Sending again keeps each
 * step's thread and its approval; a step that was sent back goes to waiting,
 * marked as sent again, with that recorded in its thread.
 */
export function submitForReview(code: string, name: string, by: Person) {
  const all = readAll();
  const key = code.toUpperCase();
  const before = all[key];
  writeAll({
    ...all,
    [key]: {
      code: key,
      name,
      submittedBy: by.name,
      submittedAt: new Date().toISOString(),
      steps: Array.from({ length: STEP_COUNT }, (_, i): StepReview => {
        const step = before?.steps[i];
        if (!step) return freshStep();
        if (step.status === "approved") return step;
        if (step.status === "changes") {
          return {
            status: "waiting",
            resubmitted: true,
            entries: [...step.entries, entry(by, "resubmitted", "")],
          };
        }
        return step;
      }),
    },
  });
}

export function addComment(code: string, step: number, by: Person, text: string) {
  update(code, (s) => ({
    ...s,
    steps: s.steps.map((st, i) =>
      i === step ? { ...st, entries: [...st.entries, entry(by, "comment", text)] } : st,
    ),
  }));
}

export function decideStep(
  code: string,
  step: number,
  by: Person,
  decision: "approved" | "changes",
  text: string,
) {
  update(code, (s) => ({
    ...s,
    steps: s.steps.map((st, i) =>
      i === step
        ? {
            status: decision,
            resubmitted: false,
            entries: [...st.entries, entry(by, decision, text)],
          }
        : st,
    ),
  }));
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

const NONE: Record<string, Submission> = {};

/** Every submission, newest first. */
export function useSubmissions(): Submission[] {
  const all = React.useSyncExternalStore(subscribe, readAll, () => NONE);
  return React.useMemo(
    () => Object.values(all).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)),
    [all],
  );
}

/** One country's submission, or null when it has not been sent for approval. */
export function useSubmission(code: string): Submission | null {
  const all = React.useSyncExternalStore(subscribe, readAll, () => NONE);
  return all[code.toUpperCase()] ?? null;
}

export const approvedCount = (s: Submission) =>
  s.steps.filter((st) => st.status === "approved").length;

/** Where a submission stands as a whole. */
export function overallStatus(s: Submission): "approved" | "changes" | "waiting" {
  if (s.steps.every((st) => st.status === "approved")) return "approved";
  if (s.steps.some((st) => st.status === "changes")) return "changes";
  return "waiting";
}
