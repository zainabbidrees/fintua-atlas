"use client";

import * as React from "react";
import { BOX_QUERIES, type BoxQuery } from "@/lib/mock/query-builder";

export type QueryStatus = "empty" | "generating" | "generated" | "edited";

export interface QueryState {
  sql: string;
  status: QueryStatus;
  /** What the box should calculate, in plain English — required wherever
   *  there is no query, so a box is never left saying nothing. */
  note: string;
}

/** Every row's query, keyed by box id — what Undo hands back. */
export type QuerySnapshot = Record<string, QueryState>;

/* The agent takes a moment per query, and finishes them one after another
   rather than all at once, so a batch reads as worked through. */
const FIRST_MS = 2000;
const EACH_MS = 280;

/**
 * The query builder's state. Every box starts with no query; Generate fills
 * the ticked ones from the box's rule, and a query edited by hand is marked as
 * such so a reviewer can tell it from a generated one. A box with no query
 * must say in plain English what it should calculate before the step can be
 * sent on.
 */
export function useQueryBuilder(_countryCode: string) {
  const boxes: BoxQuery[] = BOX_QUERIES;
  const [queries, setQueries] = React.useState<QuerySnapshot>(() =>
    Object.fromEntries(boxes.map((b) => [b.id, { sql: "", status: "empty", note: "" }])),
  );
  const timers = React.useRef<number[]>([]);

  React.useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((t) => window.clearTimeout(t));
  }, []);

  /** Generates the given boxes, then calls `onDone` with what they held
   *  before — so the toast, and its Undo, arrive once the batch has landed. */
  function generate(ids: string[], onDone?: (before: QuerySnapshot) => void) {
    const before: QuerySnapshot = Object.fromEntries(ids.map((id) => [id, queries[id]]));
    setQueries((q) => {
      const next = { ...q };
      for (const id of ids) next[id] = { ...next[id], status: "generating" };
      return next;
    });
    ids.forEach((id, i) => {
      const box = boxes.find((b) => b.id === id);
      const timer = window.setTimeout(() => {
        setQueries((q) => ({
          ...q,
          [id]: { ...q[id], sql: box?.generated ?? "", status: "generated" },
        }));
        if (i === ids.length - 1) onDone?.(before);
      }, FIRST_MS + i * EACH_MS);
      timers.current.push(timer);
    });
  }

  function save(id: string, sql: string) {
    setQueries((q) => ({
      ...q,
      [id]: { ...q[id], sql, status: sql.trim() ? "edited" : "empty" },
    }));
  }

  /** Sets a box's plain-English description. */
  function describe(id: string, note: string) {
    setQueries((q) => ({ ...q, [id]: { ...q[id], note } }));
  }

  function restore(snapshot: QuerySnapshot) {
    setQueries((q) => ({ ...q, ...snapshot }));
  }

  const ready = boxes.filter((b) => queries[b.id].sql.trim()).length;
  const generating = boxes.some((b) => queries[b.id].status === "generating");
  /* Boxes with neither a query nor a description — each holds the step back.
     A box calculated in the field map already has its query: the calculation. */
  const undescribed = boxes.filter(
    (b) => !b.calculation && !queries[b.id].sql.trim() && !queries[b.id].note.trim(),
  ).length;

  return { boxes, queries, generate, save, describe, restore, ready, generating, undescribed };
}

export type QueryBuilder = ReturnType<typeof useQueryBuilder>;
