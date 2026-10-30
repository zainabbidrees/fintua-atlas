"use client";

import * as React from "react";
import { hasQueryStep } from "./query-step";
import type { Person, Role } from "./session";

/**
 * Submissions for approval, one per country, kept in localStorage like the
 * published list (src/lib/published.ts) until there is a service to hold them.
 *
 * Only some steps need a reviewer's approval (approvalSteps). The expert
 * sends each one from the step itself and carries straight on to the next —
 * nothing waits on the reviewer. The reviewer approves them in order: a step
 * opens for a decision only once every approval step before it is approved.
 * A step sent back and sent again goes to waiting, marked as resubmitted, so
 * the reviewer knows to look again. Each step keeps its own thread of comments
 * and decisions — the record the audit trail is made of.
 */

export type StepStatus = "not_sent" | "waiting" | "approved" | "changes";

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

/** The steps a reviewer approves: Return Types, Form Annotations & Box
    Mapping, Tax Rules Generation and — when the country has a calculated box —
    Query Builder. Select Country and Tax Form Retrieval need no approval. */
export const approvalSteps = (code: string): readonly number[] =>
  hasQueryStep(code) ? [1, 3, 4, 5] : [1, 3, 4];

export const needsApproval = (code: string, step: number) => approvalSteps(code).includes(step);

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

const freshStep = (): StepReview => ({ status: "not_sent", resubmitted: false, entries: [] });

/**
 * Sends one step for approval, from the step. The country's submission is
 * started on its first step sent. Sending a step that was sent back marks it
 * as sent again, in its thread too.
 */
export function submitStep(code: string, name: string, step: number, by: Person) {
  const all = readAll();
  const key = code.toUpperCase();
  const before = all[key];
  const steps = Array.from({ length: STEP_COUNT }, (_, i) => before?.steps[i] ?? freshStep());
  const was = steps[step];
  steps[step] = {
    status: "waiting",
    resubmitted: was.status === "changes",
    entries: was.status === "changes" ? [...was.entries, entry(by, "resubmitted", "")] : was.entries,
  };
  writeAll({
    ...all,
    [key]: {
      code: key,
      name,
      submittedBy: by.name,
      submittedAt: new Date().toISOString(),
      steps,
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
  approvalSteps(s.code).filter((i) => s.steps[i]?.status === "approved").length;

export const allApproved = (s: Submission) => approvedCount(s) === approvalSteps(s.code).length;

/** Where a submission stands as a whole. */
export function overallStatus(s: Submission): "approved" | "changes" | "waiting" {
  if (allApproved(s)) return "approved";
  if (approvalSteps(s.code).some((i) => s.steps[i]?.status === "changes")) return "changes";
  return "waiting";
}

/**
 * Why a reviewer cannot decide on a step yet, or null when they can: it has
 * not been sent, or an approval step before it is not approved — the reviewer
 * works through them in order.
 */
export function blockedBy(
  s: Submission,
  step: number,
): { reason: "not_sent" } | { reason: "earlier"; step: number } | null {
  if (!needsApproval(s.code, step)) return null;
  if ((s.steps[step]?.status ?? "not_sent") === "not_sent") return { reason: "not_sent" };
  const earlier = approvalSteps(s.code).find((i) => i < step && s.steps[i]?.status !== "approved");
  return earlier === undefined ? null : { reason: "earlier", step: earlier };
}
