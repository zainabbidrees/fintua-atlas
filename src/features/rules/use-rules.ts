"use client";

import * as React from "react";
import { datasetsFor } from "@/lib/mock/rules";
import {
  SPEC_STAGES,
  type Dataset,
  type DatasetId,
  type RuleRow,
  type SpecStage,
} from "@/lib/types";

/**
 * Edits are tracked but not interrogated.
 *
 * Correcting a researched fact in step 2 demands a rationale — you are
 * disagreeing with the law as the agent read it. Here you are configuring a
 * mapping, and asking for prose on every cell would make the step unusable.
 * Changes are marked, the agent's original is retained, and each part of the
 * step is signed off as a whole.
 *
 * The gating is the point of this hook. A stage is finished when nothing in it
 * is still open, and until then the next one is genuinely unreachable — not
 * merely discouraged. That is what stops a rule being written against a grid
 * nobody has declared.
 */

/** Why a row is still open. Empty means it is settled. */
function rowBlockers(row: RuleRow, dataset: Dataset): string[] {
  const out: string[] = [];
  if (row.issue) out.push(row.issue);
  for (const col of dataset.columns) {
    if (!col.required) continue;
    const value = row.cells[col.key]?.value?.trim();
    if (!value) out.push(`${col.label} is empty`);
  }
  return out;
}

export function useRules(countryCode: string) {
  const [datasets, setDatasets] = React.useState<Record<DatasetId, Dataset>>(() =>
    structuredClone(datasetsFor(countryCode)),
  );
  const [stageIndex, setStageIndex] = React.useState(0);
  const [active, setActive] = React.useState<DatasetId>(SPEC_STAGES[0].datasets[0]);

  const openIn = React.useCallback(
    (d: Dataset) =>
      d.rows.reduce((n, r) => n + (rowBlockers(r, d).length > 0 ? 1 : 0), 0) +
      d.uncovered.length,
    [],
  );

  const openInStage = React.useCallback(
    (stage: SpecStage) =>
      stage.datasets.reduce((n, id) => n + openIn(datasets[id]), 0),
    [datasets, openIn],
  );

  /** The first stage still carrying work. Everything after it is locked. */
  const frontier = React.useMemo(() => {
    const i = SPEC_STAGES.findIndex((s) => openInStage(s) > 0);
    return i === -1 ? SPEC_STAGES.length - 1 : i;
  }, [openInStage]);

  const reachable = React.useCallback(
    (i: number) => i <= Math.max(frontier, stageIndex),
    [frontier, stageIndex],
  );

  const goToStage = React.useCallback(
    (i: number) => {
      if (i < 0 || i >= SPEC_STAGES.length || !reachable(i)) return;
      setStageIndex(i);
      setActive(SPEC_STAGES[i].datasets[0]);
    },
    [reachable],
  );

  const mutate = React.useCallback(
    (id: DatasetId, fn: (d: Dataset) => Dataset) =>
      setDatasets((all) => ({ ...all, [id]: fn(all[id]) })),
    [],
  );

  const edit = React.useCallback(
    (datasetId: DatasetId, rowId: string, key: string, value: string) =>
      mutate(datasetId, (ds) => ({
        ...ds,
        rows: ds.rows.map((r) =>
          r.id === rowId
            ? {
                ...r,
                cells: {
                  ...r.cells,
                  [key]: {
                    value,
                    original: r.cells[key]?.original ?? r.cells[key]?.value,
                  },
                },
              }
            : r,
        ),
      })),
    [mutate],
  );

  /** Marks a flagged row as settled once a human has dealt with it. */
  const resolve = React.useCallback(
    (datasetId: DatasetId, rowId: string) =>
      mutate(datasetId, (ds) => ({
        ...ds,
        rows: ds.rows.map((r) => (r.id === rowId ? { ...r, issue: undefined } : r)),
      })),
    [mutate],
  );

  const dismissGap = React.useCallback(
    (datasetId: DatasetId, name: string) =>
      mutate(datasetId, (ds) => ({
        ...ds,
        uncovered: ds.uncovered.filter((u) => u !== name),
      })),
    [mutate],
  );

  const addRow = React.useCallback(
    (datasetId: DatasetId) =>
      mutate(datasetId, (ds) => ({
        ...ds,
        rows: [
          ...ds.rows,
          {
            id: `${datasetId}-${Date.now()}`,
            addedByHand: true,
            cells: Object.fromEntries(
              ds.columns.map((col) => [
                col.key,
                { value: col.kind === "flag" ? "no" : "" },
              ]),
            ),
          },
        ],
      })),
    [mutate],
  );

  const deleteRow = React.useCallback(
    (datasetId: DatasetId, rowId: string) =>
      mutate(datasetId, (ds) => ({
        ...ds,
        rows: ds.rows.filter((r) => r.id !== rowId),
      })),
    [mutate],
  );

  /**
   * The stage order made literal: a rule's rate and box columns offer exactly
   * what the earlier parts declared, and nothing else. Declare a grid in part
   * two and it appears in the lists in part three; delete it and the rules
   * citing it are left visibly empty.
   */
  const withDeclaredOptions = React.useCallback(
    (ds: Dataset): Dataset => {
      const codes = datasets.rates.rows
        .map((r) => r.cells.code?.value.trim())
        .filter(Boolean) as string[];
      const boxes = datasets.boxes.rows
        .map((r) => r.cells.box?.value.trim())
        .filter(Boolean) as string[];

      const lists: Record<string, string[]> =
        ds.id === "sales" || ds.id === "purchases"
          ? { rate: codes, base: boxes, vat: boxes }
          : ds.id === "vies"
            ? { box: boxes }
            : {};

      if (Object.keys(lists).length === 0) return ds;

      return {
        ...ds,
        columns: ds.columns.map((col) =>
          lists[col.key]
            ? { ...col, kind: "select" as const, options: lists[col.key] }
            : col,
        ),
      };
    },
    [datasets],
  );

  const stage = SPEC_STAGES[stageIndex];

  return {
    datasets,
    stage,
    stageIndex,
    stages: SPEC_STAGES,
    goToStage,
    reachable,
    active,
    setActive,
    current: withDeclaredOptions(datasets[active]),
    edit,
    resolve,
    dismissGap,
    addRow,
    deleteRow,
    rowBlockers,
    openIn,
    openInStage,
    openInCurrentStage: openInStage(stage),
    allSettled: SPEC_STAGES.every((s) => openInStage(s) === 0),
  };
}
