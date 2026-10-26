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
 * Changes are marked, the agent's original is retained, and the step is signed
 * off as a whole.
 *
 * The three parts — returns, form & rates, rules & mapping — are shown together
 * on one page rather than gated one behind the next. The order they depend on
 * still holds (a rule can only target a box and rate declared above it), and
 * `view` makes that literal: a rule's columns offer exactly what the earlier
 * parts have declared. The step is done when nothing anywhere is still open.
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

  return {
    datasets,
    stages: SPEC_STAGES,
    /** A dataset with its rate and box columns narrowed to what the parts above
        it have declared — the dependency order, made literal on one page. */
    view: (id: DatasetId) => withDeclaredOptions(datasets[id]),
    edit,
    resolve,
    dismissGap,
    addRow,
    deleteRow,
    rowBlockers,
    openIn,
    openInStage,
    totalOpen: SPEC_STAGES.reduce((n, s) => n + openInStage(s), 0),
    allSettled: SPEC_STAGES.every((s) => openInStage(s) === 0),
  };
}
