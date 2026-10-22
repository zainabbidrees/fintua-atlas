"use client";

import * as React from "react";
import { datasetsFor } from "@/lib/mock/rules";
import type { Dataset, DatasetId } from "@/lib/types";

/**
 * Edits are tracked but not interrogated.
 *
 * Correcting a researched fact in step 2 demands a rationale — you are
 * disagreeing with the law as the agent read it. Here you are configuring a
 * mapping, and asking for prose on every cell would make the step unusable.
 * Changes are marked, the agent's original is retained, and the step is signed
 * off as a whole.
 */
export function useRules(countryCode: string) {
  const [datasets, setDatasets] = React.useState<Record<DatasetId, Dataset>>(() =>
    structuredClone(datasetsFor(countryCode)),
  );
  const [active, setActive] = React.useState<DatasetId>("rates");

  const edit = React.useCallback(
    (datasetId: DatasetId, rowId: string, key: string, value: string) => {
      setDatasets((all) => {
        const ds = all[datasetId];
        return {
          ...all,
          [datasetId]: {
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
          },
        };
      });
    },
    [],
  );

  /** Marks a flagged row as settled once a human has dealt with it. */
  const resolve = React.useCallback((datasetId: DatasetId, rowId: string) => {
    setDatasets((all) => {
      const ds = all[datasetId];
      return {
        ...all,
        [datasetId]: {
          ...ds,
          rows: ds.rows.map((r) =>
            r.id === rowId ? { ...r, issue: undefined } : r,
          ),
        },
      };
    });
  }, []);

  const dismissGap = React.useCallback((datasetId: DatasetId, name: string) => {
    setDatasets((all) => {
      const ds = all[datasetId];
      return {
        ...all,
        [datasetId]: { ...ds, uncovered: ds.uncovered.filter((u) => u !== name) },
      };
    });
  }, []);

  const list = Object.values(datasets);
  const issuesIn = (d: Dataset) => d.rows.filter((r) => r.issue).length;
  const openItems = list.reduce(
    (n, d) => n + issuesIn(d) + d.uncovered.length,
    0,
  );

  return {
    datasets,
    active,
    setActive,
    current: datasets[active],
    edit,
    resolve,
    dismissGap,
    issuesIn,
    openItems,
  };
}
