"use client";

import * as React from "react";
import { PURCHASES, RATES, SALES } from "@/lib/mock/tax-rules";

export type SheetId = "rates" | "sales" | "purchases";

const INITIAL: Record<SheetId, string[][]> = {
  rates: RATES,
  sales: SALES,
  purchases: PURCHASES,
};

/** A row's key across the three sheets. */
export const ruleKey = (sheet: SheetId, index: number) => `${sheet}:${index}`;

/**
 * The generated rules while the expert corrects them — the same shape as the
 * spec sheets on step four. A row is read-only until its pen opens it; edits
 * collect in a draft, and nothing is kept until Save changes.
 */
export function useRuleEdits() {
  const [saved, setSaved] = React.useState(INITIAL);
  const [draft, setDraft] = React.useState(INITIAL);
  const [editing, setEditing] = React.useState<ReadonlySet<string>>(new Set());

  function setCell(sheet: SheetId, row: number, col: number, value: string) {
    setDraft((d) => ({
      ...d,
      [sheet]: d[sheet].map((r, i) =>
        i === row ? r.map((cell, c) => (c === col ? value : cell)) : r,
      ),
    }));
  }

  function toggleEditing(key: string) {
    setEditing((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  /** Keys of the rows whose draft differs from what was last saved. */
  const changed = React.useMemo(() => {
    const keys = new Set<string>();
    for (const sheet of Object.keys(draft) as SheetId[]) {
      draft[sheet].forEach((row, i) => {
        const before = saved[sheet][i] ?? [];
        if (row.some((cell, c) => cell !== (before[c] ?? ""))) keys.add(ruleKey(sheet, i));
      });
    }
    return keys;
  }, [draft, saved]);

  function save() {
    setSaved(draft);
    setEditing(new Set());
  }

  return { rows: draft, editing, changed, setCell, toggleEditing, save };
}

export type RuleEdits = ReturnType<typeof useRuleEdits>;
