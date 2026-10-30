"use client";

import * as React from "react";
import { completedFindingsFor, obligationsFor } from "@/lib/mock/obligations";
import type { Finding, ObligationRun } from "@/lib/types";

/** The return type a row belongs to. */
export const returnTypeOf = (o: ObligationRun) => o.returnTypeId ?? o.id;

/** Rows the expert added carry this id prefix, to tell them from the agent's. */
export const ADDED_ROW = "added-";
export const isAddedRow = (o: ObligationRun) => o.id.startsWith(ADDED_ROW);

/** What the Add row form collects: every field but the rationale is chosen. */
export interface NewRow {
  returnTypeId: string;
  frequency: string;
  deadline: string;
  nonWorkingDay: "next" | "previous" | "none";
  workdaysOnly: boolean;
  rationale: string;
}

/**
 * One row per filing schedule. A return type filed on several — a monthly
 * default and a quarterly option, each with its own deadline — becomes that
 * many complete rows, each with the return type's name, its own tick, Attach
 * and Confirm, and only that schedule's frequency and deadline. Findings that
 * belong to no schedule go with every row. A return type with one schedule
 * stays one row, with its own id.
 */
function bySchedule(obligations: ObligationRun[]): ObligationRun[] {
  return obligations.flatMap((o) => {
    const keys = [...new Set(o.findings.flatMap((f) => (f.schedule ? [f.schedule] : [])))];
    if (keys.length < 2) return [o];
    return keys.map((key) => ({
      ...o,
      id: `${o.id}:${key}`,
      returnTypeId: o.id,
      findings: o.findings.filter((f) => !f.schedule || f.schedule === key),
    }));
  });
}

/**
 * The stages a return moves through before it is filed, in order. The days
 * between each pair are the expert's to set — the agent cannot read them off
 * a source — and are stored as the sheet's five offsets.
 */
export const WORKFLOW_STAGES = ["dataDue", "prepare", "review", "approve", "submit", "due"] as const;

/** Days between consecutive stages: data due→prepare, prepare→review,
    review→approve, approve→submit, submit→submission due date. */
export type WorkflowDays = [number, number, number, number, number];

/** Something the expert attached from the rail — a file or a pasted link. */
export interface Upload {
  id: string;
  label: string;
  kind: "file" | "link";
}

/**
 * Review state for the Returns step.
 *
 * Agents run per obligation and in parallel, so one can still be researching
 * while the specialist works through another. Nothing here blocks on a running
 * agent.
 */
export function useReturns(countryCode: string) {
  const [obligations, setObligations] = React.useState<ObligationRun[]>(() =>
    bySchedule(obligationsFor(countryCode)),
  );
  const [selectedId, setSelectedId] = React.useState(
    () => bySchedule(obligationsFor(countryCode))[0]?.id ?? "",
  );

  const selected =
    obligations.find((o) => o.id === selectedId) ?? obligations[0];

  /* Supporting material the expert attaches, kept per return type: a form or an
     advisor's note belongs to the return it concerns, so each row carries its
     own, listed in its own Attach cell. */
  const [uploadsById, setUploadsById] = React.useState<Record<string, Upload[]>>(
    {},
  );
  const uploadsFor = React.useCallback(
    (obligationId: string): Upload[] => uploadsById[obligationId] ?? [],
    [uploadsById],
  );
  const addUpload = React.useCallback(
    (obligationId: string, item: { label: string; kind: "file" | "link" }) => {
      setUploadsById((map) => ({
        ...map,
        [obligationId]: [
          ...(map[obligationId] ?? []),
          {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            ...item,
          },
        ],
      }));
    },
    [],
  );
  const removeUpload = React.useCallback(
    (obligationId: string, uploadId: string) => {
      setUploadsById((map) => ({
        ...map,
        [obligationId]: (map[obligationId] ?? []).filter(
          (x) => x.id !== uploadId,
        ),
      }));
    },
    [],
  );

  /* The agent's original finding for each id, so the per-row undo can put a
     confirmed or corrected value back exactly as it was first proposed. */
  const originalById = React.useMemo(() => {
    const map = new Map<string, Finding>();
    for (const o of obligationsFor(countryCode)) {
      const base = o.findings.length ? o.findings : completedFindingsFor(o.id);
      for (const f of base) map.set(f.id, f);
    }
    return map;
  }, [countryCode]);

  /* Narrow to the return types carried forward from step one, when that choice
     was recorded there. Done after mount so the first render matches the server
     (both start from the full set); a missing or empty record keeps them all. */
  React.useEffect(() => {
    let carried: unknown = null;
    try {
      const raw = localStorage.getItem(`fintua:carried:${countryCode}`);
      carried = raw ? JSON.parse(raw) : null;
    } catch {
      carried = null;
    }
    if (!Array.isArray(carried) || carried.length === 0) return;
    const keep = new Set(carried as string[]);
    // Syncing from localStorage after mount (to match the server's first render)
    // is the one case that legitimately needs setState in an effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setObligations((all) => {
      const next = all.filter((o) => keep.has(returnTypeOf(o)));
      return next.length ? next : all;
    });
  }, [countryCode]);

  /* Keep the open return valid if the carried filter dropped the selected one. */
  React.useEffect(() => {
    if (obligations.length && !obligations.some((o) => o.id === selectedId)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedId(obligations[0].id);
    }
  }, [obligations, selectedId]);

  /**
   * A running agent finishes on its own while the specialist works elsewhere.
   * Without this the obligation researches forever and the step can never be
   * completed — the one case the parallel-agent mock has to be able to show.
   */
  React.useEffect(() => {
    const id = setInterval(() => {
      setObligations((all) => {
        if (!all.some((o) => o.agent === "running")) return all;

        return all.flatMap((o) => {
          if (o.agent !== "running") return [o];
          const progress = Math.min(100, o.progress + 12);
          if (progress < 100) return [{ ...o, progress }];
          // What lands may have several schedules, so it is split like the rest.
          return bySchedule([
            {
              ...o,
              agent: "ready" as const,
              progress: 100,
              findings: completedFindingsFor(returnTypeOf(o)),
            },
          ]);
        });
      });
    }, 900);

    return () => clearInterval(id);
  }, []);

  const patch = React.useCallback(
    (findingId: string, change: Partial<Finding>) => {
      setObligations((all) =>
        all.map((o) => ({
          ...o,
          findings: o.findings.map((f) =>
            f.id === findingId ? { ...f, ...change } : f,
          ),
        })),
      );
    },
    [],
  );

  /** Did settling `changed` (one id, or several from a bulk action) clear the
      whole of the open return? The changed values count as settled here because
      setObligations has not yet applied them when this runs. */
  const clearsOpenReturn = (changed: Set<string>) => {
    const open = obligations.find((o) => o.id === selectedId);
    if (!open) return false;
    return open.findings.every(
      (f) =>
        changed.has(f.id) || f.state === "confirmed" || f.state === "edited",
    );
  };

  /** The next return still waiting, in order — where the sequence sends you. */
  const nextOpenReturn = () =>
    obligations.find(
      (o) =>
        o.id !== selectedId &&
        o.findings.length > 0 &&
        !o.findings.every(
          (f) => f.state === "confirmed" || f.state === "edited",
        ),
    )?.id ?? null;

  /** Clearing the last value in a return moves you straight to the next one, so
      you are never left on a finished return wondering why you can't proceed.
      Takes one id or the set from a bulk action. */
  const advanceIfCleared = (changed: string | Set<string>) => {
    const set = typeof changed === "string" ? new Set([changed]) : changed;
    if (!clearsOpenReturn(set)) return;
    const next = nextOpenReturn();
    if (next) setSelectedId(next);
  };

  const confirm = (findingId: string) => {
    patch(findingId, { state: "confirmed", concern: undefined });
    advanceIfCleared(findingId);
  };

  /** Puts a finding back exactly as it was — the undo behind a confirm toast. */
  const restore = React.useCallback((finding: Finding) => {
    setObligations((all) =>
      all.map((o) => ({
        ...o,
        findings: o.findings.map((f) => (f.id === finding.id ? finding : f)),
      })),
    );
  }, []);

  /** Keeps the agent's original value alongside the correction and its reason. */
  const edit = (finding: Finding, value: string, reason: string) => {
    patch(finding.id, {
      state: "edited",
      value,
      concern: undefined,
      originalValue: finding.originalValue ?? finding.value,
      editReason: reason,
    });
    advanceIfCleared(finding.id);
  };

  /** The per-row undo: puts a settled value back to the agent's original. */
  const reset = (findingId: string) => {
    const original = originalById.get(findingId);
    if (original) restore(original);
  };

  /** Bulk confirm: accepts several selected values at once. A deliberate break
      from confirming per value — logged in docs/decisions/deviations.md. */
  const confirmMany = (ids: string[]) => {
    const set = new Set(ids);
    setObligations((all) =>
      all.map((o) => ({
        ...o,
        findings: o.findings.map((f) =>
          set.has(f.id)
            ? { ...f, state: "confirmed" as const, concern: undefined }
            : f,
        ),
      })),
    );
    // Clearing the open return in bulk advances just as the per-value confirm
    // does, so confirming the last of them still moves you on.
    advanceIfCleared(set);
  };

  /** Bulk dismiss: drops selected findings from the return, so they leave the
      review rather than being cleared on trust. */
  const dismiss = (ids: string[]) => {
    const set = new Set(ids);
    setObligations((all) =>
      all.map((o) => ({
        ...o,
        findings: o.findings.filter((f) => !set.has(f.id)),
      })),
    );
  };

  /** Clears a whole return type in one action — the row-level Confirm. Accepts
      every value it holds, cross-checked and flagged alike, and moves on to the
      next return still waiting. */
  const confirmObligation = (obligationId: string) => {
    setObligations((all) =>
      all.map((o) =>
        o.id === obligationId
          ? {
              ...o,
              findings: o.findings.map((f) =>
                f.state === "confirmed" || f.state === "edited"
                  ? f
                  : { ...f, state: "confirmed" as const, concern: undefined },
              ),
            }
          : o,
      ),
    );
  };

  /** Undo the row-level Confirm: every value in the return goes back to exactly
      what the agent first proposed. */
  const resetObligation = React.useCallback(
    (obligationId: string) => {
      setObligations((all) =>
        all.map((o) =>
          o.id === obligationId
            ? {
                ...o,
                findings: o.findings.map(
                  (f) => originalById.get(f.id) ?? f,
                ),
              }
            : o,
        ),
      );
    },
    [originalById],
  );

  /** Accepts every finding the agent corroborated, leaving the flagged ones. */
  const confirmCorroborated = React.useCallback((obligationId: string) => {
    setObligations((all) =>
      all.map((o) =>
        o.id === obligationId
          ? {
              ...o,
              findings: o.findings.map((f) =>
                f.state === "corroborated" ? { ...f, state: "confirmed" } : f,
              ),
            }
          : o,
      ),
    );
  }, []);

  const outstanding = React.useCallback(
    (o: ObligationRun) => o.findings.filter((f) => f.state === "needs_review").length,
    [],
  );

  /** An obligation is settled once nothing in it is still awaiting a decision. */
  const isSettled = React.useCallback(
    (o: ObligationRun) =>
      o.agent !== "running" &&
      o.findings.length > 0 &&
      o.findings.every((f) => f.state === "confirmed" || f.state === "edited"),
    [],
  );

  const allSettled = obligations.every(
    (o) => o.agent === "running" || isSettled(o),
  );
  const anyRunning = obligations.some((o) => o.agent === "running");
  const totalOutstanding = obligations.reduce((n, o) => n + outstanding(o), 0);

  /* The manual columns, which the agent cannot give: each row's offset (the
     days between workflow stages, zero until the expert sets them),
     and which frequency is the default for its return type. Every return type
     starts with its first schedule as the default, so one is always chosen. */
  const [workflow, setWorkflowState] = React.useState<Record<string, WorkflowDays>>({});
  const [defaults, setDefaults] = React.useState<Record<string, string>>({});
  const workflowFor = (rowId: string): WorkflowDays | null => workflow[rowId] ?? null;
  const defaultFor = (returnTypeId: string): string =>
    defaults[returnTypeId] ??
    obligations.find((o) => returnTypeOf(o) === returnTypeId)?.id ??
    "";
  const isDefault = (o: ObligationRun) => defaultFor(returnTypeOf(o)) === o.id;

  /** Sets a row's days; `toUnset` gives the same days to every row still
      without any, so one row filled can fill the rest. */
  function setWorkflow(rowId: string, days: WorkflowDays, toUnset = false) {
    setWorkflowState((w) => {
      const next = { ...w, [rowId]: days };
      if (toUnset) for (const o of obligations) if (!next[o.id]) next[o.id] = days;
      return next;
    });
  }

  function setDefault(o: ObligationRun) {
    setDefaults((d) => ({ ...d, [returnTypeOf(o)]: o.id }));
  }

  /** Adds a schedule the agent did not find, after the last row of its return
   *  type. Its values are the expert's own — settled, with the rationale kept
   *  where a correction's reason goes — and it has no source behind it. */
  function addRow(row: NewRow): string {
    const id = `${ADDED_ROW}${Date.now()}`;
    const type = obligations.find((o) => returnTypeOf(o) === row.returnTypeId);
    const evidence = { sourceTitle: "", publisher: "", url: `manual:${id}`, quote: row.rationale };
    const own = { group: "filing" as const, evidence, state: "edited" as const, editReason: row.rationale };
    const next: ObligationRun = {
      id,
      returnTypeId: row.returnTypeId,
      name: type?.name ?? "",
      localName: type?.localName ?? null,
      agent: "ready",
      progress: 100,
      findings: [
        { ...own, id: `${id}:frequency`, role: "frequency", schedule: id, label: "Filing frequency", value: row.frequency },
        {
          ...own,
          id: `${id}:deadline`,
          role: "deadline",
          schedule: id,
          label: "Filing deadline",
          value: row.deadline,
          nonWorkingDay: row.nonWorkingDay,
          workdaysOnly: row.workdaysOnly,
        },
      ],
    };
    setObligations((all) => {
      const at = all.findLastIndex((o) => returnTypeOf(o) === row.returnTypeId);
      return at < 0 ? [...all, next] : [...all.slice(0, at + 1), next, ...all.slice(at + 1)];
    });
    return id;
  }

  /** Takes an added row back out; `restoreRow` puts it back where it was. */
  function removeRow(id: string): { row: ObligationRun; index: number } | null {
    const index = obligations.findIndex((o) => o.id === id);
    if (index < 0) return null;
    const row = obligations[index];
    setObligations((all) => all.filter((o) => o.id !== id));
    return { row, index };
  }

  function restoreRow(row: ObligationRun, index: number) {
    setObligations((all) => [...all.slice(0, index), row, ...all.slice(index)]);
  }

  return {
    obligations,
    selected,
    workflowFor,
    setWorkflow,
    isDefault,
    setDefault,
    addRow,
    removeRow,
    restoreRow,
    selectedId: selected?.id ?? "",
    setSelectedId,
    uploadsFor,
    addUpload,
    removeUpload,
    confirm,
    restore,
    reset,
    edit,
    confirmMany,
    dismiss,
    confirmObligation,
    resetObligation,
    confirmCorroborated,
    outstanding,
    isSettled,
    allSettled,
    anyRunning,
    totalOutstanding,
  };
}
