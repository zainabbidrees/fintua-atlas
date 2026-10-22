"use client";

import * as React from "react";
import { obligationsFor } from "@/lib/mock/obligations";
import type { Finding, ObligationRun } from "@/lib/types";

/**
 * Review state for the Returns step.
 *
 * Agents run per obligation and in parallel, so one can still be researching
 * while the specialist works through another. Nothing here blocks on a running
 * agent.
 */
export function useReturns(countryCode: string) {
  const [obligations, setObligations] = React.useState<ObligationRun[]>(() =>
    obligationsFor(countryCode),
  );
  const [selectedId, setSelectedId] = React.useState(
    () => obligationsFor(countryCode)[0]?.id ?? "",
  );

  const selected =
    obligations.find((o) => o.id === selectedId) ?? obligations[0];

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

  const confirm = React.useCallback(
    (findingId: string) => patch(findingId, { state: "confirmed", concern: undefined }),
    [patch],
  );

  /** Keeps the agent's original value alongside the correction and its reason. */
  const edit = React.useCallback(
    (finding: Finding, value: string, reason: string) =>
      patch(finding.id, {
        state: "edited",
        value,
        concern: undefined,
        originalValue: finding.originalValue ?? finding.value,
        editReason: reason,
      }),
    [patch],
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

  return {
    obligations,
    selected,
    selectedId: selected?.id ?? "",
    setSelectedId,
    confirm,
    edit,
    confirmCorroborated,
    outstanding,
    isSettled,
    allSettled,
    anyRunning,
    totalOutstanding,
  };
}
