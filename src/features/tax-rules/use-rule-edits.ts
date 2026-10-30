"use client";

import * as React from "react";
import type { ColumnType } from "@/components/patterns/add-column-dialog";
import {
  PURCHASES,
  PURCHASES_COLUMNS,
  RATES,
  RATES_COLUMNS,
  SALES,
  SALES_COLUMNS,
} from "@/lib/mock/tax-rules";

export type SheetId = "rates" | "sales" | "purchases";

/** A rule, with an id that stays with it when rows above are added or removed. */
interface Rule {
  id: string;
  cells: string[];
}

const withIds = (sheet: SheetId, rows: string[][]): Rule[] =>
  rows.map((cells, i) => ({ id: `${sheet}-${i}`, cells }));

const INITIAL: Record<SheetId, Rule[]> = {
  rates: withIds("rates", RATES),
  sales: withIds("sales", SALES),
  purchases: withIds("purchases", PURCHASES),
};

const INITIAL_COLUMNS: Record<SheetId, readonly string[]> = {
  rates: RATES_COLUMNS,
  sales: SALES_COLUMNS,
  purchases: PURCHASES_COLUMNS,
};

let added = 0;
const newId = (sheet: SheetId) => `${sheet}-added-${Date.now()}-${added++}`;

/** A rule's key across the three sheets — its sheet and its id. */
const keyOf = (sheet: SheetId, id: string) => `${sheet}:${id}`;

/**
 * The generated rules while the expert corrects them — the same shape as the
 * spec sheets on step four. A row is read-only until its pen opens it; edits
 * collect in a draft, and nothing is kept until Save changes.
 *
 * Rows can be added, duplicated and deleted, and columns added. All are
 * drafts like any edit: a new or copied row is unsaved until Save, a deleted
 * one counts as a change until Save, and a new column marks every row of its
 * sheet as changed, since each one gained a cell.
 */
export function useRuleEdits() {
  const [saved, setSaved] = React.useState(INITIAL);
  const [draft, setDraft] = React.useState(INITIAL);
  const [columns, setColumns] = React.useState(INITIAL_COLUMNS);
  /* The columns the expert added, by sheet, with what each holds. Only these
     can be deleted: the sheet's own columns are what Comply already runs. */
  const [addedColumns, setAddedColumns] = React.useState<
    Record<SheetId, { name: string; type?: ColumnType }[]>
  >({ rates: [], sales: [], purchases: [] });
  const [editing, setEditing] = React.useState<ReadonlySet<string>>(new Set());

  /** The key of the row at `index` in a sheet, for editing and change marks. */
  const ruleKey = (sheet: SheetId, index: number) =>
    keyOf(sheet, draft[sheet][index]?.id ?? String(index));

  function setCell(sheet: SheetId, row: number, col: number, value: string) {
    setDraft((d) => ({
      ...d,
      [sheet]: d[sheet].map((r, i) =>
        i === row ? { ...r, cells: r.cells.map((cell, c) => (c === col ? value : cell)) } : r,
      ),
    }));
  }

  function open(sheet: SheetId, id: string) {
    setEditing((prev) => new Set(prev).add(keyOf(sheet, id)));
  }

  /** Appends a blank rule to a sheet, open for editing; returns its index. */
  function addRow(sheet: SheetId): number {
    const index = draft[sheet].length;
    const id = newId(sheet);
    setDraft((d) => ({ ...d, [sheet]: [...d[sheet], { id, cells: columns[sheet].map(() => "") }] }));
    open(sheet, id);
    return index;
  }

  /** Copies a rule in beneath itself, open so what differs can be changed. */
  function duplicateRow(sheet: SheetId, index: number) {
    const source = draft[sheet][index];
    if (!source) return;
    const id = newId(sheet);
    setDraft((d) => {
      const rows = [...d[sheet]];
      rows.splice(index + 1, 0, { id, cells: [...source.cells] });
      return { ...d, [sheet]: rows };
    });
    open(sheet, id);
  }

  /** Takes a rule out of the draft and returns it, for `restoreRow`. */
  function deleteRow(sheet: SheetId, index: number): Rule | undefined {
    const rule = draft[sheet][index];
    if (!rule) return undefined;
    setDraft((d) => ({ ...d, [sheet]: d[sheet].filter((r) => r.id !== rule.id) }));
    setEditing((prev) => {
      const next = new Set(prev);
      next.delete(keyOf(sheet, rule.id));
      return next;
    });
    return rule;
  }

  function restoreRow(sheet: SheetId, index: number, rule: Rule) {
    setDraft((d) => {
      if (d[sheet].some((r) => r.id === rule.id)) return d;
      const rows = [...d[sheet]];
      rows.splice(index, 0, rule);
      return { ...d, [sheet]: rows };
    });
  }

  /** Appends a column to a sheet, giving every row `value` in it. */
  function addColumn(sheet: SheetId, name: string, value: string, type?: ColumnType) {
    setColumns((c) => ({ ...c, [sheet]: [...c[sheet], name] }));
    setAddedColumns((a) => ({ ...a, [sheet]: [...a[sheet], { name, type }] }));
    setDraft((d) => ({ ...d, [sheet]: d[sheet].map((r) => ({ ...r, cells: [...r.cells, value] })) }));
  }

  /** What an added column holds; undefined for the sheet's own columns. */
  const addedColumn = (sheet: SheetId, name: string) =>
    addedColumns[sheet].find((c) => c.name === name);

  /** Takes an added column out, cells and all, from the draft and from what
   *  was saved — it never reached Comply, so there is nothing to keep. Returns
   *  what `restoreColumn` needs to put it back. */
  function deleteColumn(sheet: SheetId, name: string) {
    const at = columns[sheet].indexOf(name);
    const meta = addedColumn(sheet, name);
    if (at < 0 || !meta) return null;
    const cells = new Map(draft[sheet].map((r) => [r.id, r.cells[at] ?? ""]));
    const savedCells = new Map(saved[sheet].map((r) => [r.id, r.cells[at]]));
    const drop = (rules: Rule[]) =>
      rules.map((r) => ({ ...r, cells: r.cells.filter((_, c) => c !== at) }));
    setColumns((c) => ({ ...c, [sheet]: c[sheet].filter((_, i) => i !== at) }));
    setAddedColumns((a) => ({ ...a, [sheet]: a[sheet].filter((c) => c.name !== name) }));
    setDraft((d) => ({ ...d, [sheet]: drop(d[sheet]) }));
    /* A saved column goes from the saved sheet too, so removing it does not
       leave every row reading as changed. */
    if (saved[sheet][0]?.cells.length === columns[sheet].length) {
      setSaved((v) => ({ ...v, [sheet]: drop(v[sheet]) }));
    }
    return { sheet, at, meta, cells, savedCells };
  }

  /** Undoes `deleteColumn`: the column back in its place, each row's cell too. */
  function restoreColumn(taken: NonNullable<ReturnType<typeof deleteColumn>>) {
    const { sheet, at, meta, cells, savedCells } = taken;
    const put = (rules: Rule[], from: Map<string, string | undefined>) =>
      rules.map((r) => {
        const cell = from.get(r.id);
        if (cell === undefined) return r;
        const next = [...r.cells];
        next.splice(at, 0, cell);
        return { ...r, cells: next };
      });
    setColumns((c) => {
      const next = [...c[sheet]];
      next.splice(at, 0, meta.name);
      return { ...c, [sheet]: next };
    });
    setAddedColumns((a) => ({ ...a, [sheet]: [...a[sheet], meta] }));
    setDraft((d) => ({ ...d, [sheet]: put(d[sheet], cells) }));
    setSaved((v) => ({ ...v, [sheet]: put(v[sheet], savedCells) }));
  }

  function toggleEditing(key: string) {
    setEditing((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  /** Keys of the rows whose draft differs from what was last saved — a new
      row, a new cell, or a changed one — plus rows deleted since. */
  const changed = React.useMemo(() => {
    const keys = new Set<string>();
    for (const sheet of Object.keys(draft) as SheetId[]) {
      const before = new Map(saved[sheet].map((r) => [r.id, r.cells]));
      const now = new Set(draft[sheet].map((r) => r.id));
      for (const { id, cells } of draft[sheet]) {
        const was = before.get(id);
        if (!was || cells.length !== was.length || cells.some((cell, c) => cell !== was[c])) {
          keys.add(keyOf(sheet, id));
        }
      }
      for (const id of before.keys()) if (!now.has(id)) keys.add(keyOf(sheet, id));
    }
    return keys;
  }, [draft, saved]);

  function save() {
    setSaved(draft);
    setEditing(new Set());
  }

  const rows = React.useMemo(
    () =>
      Object.fromEntries(
        (Object.keys(draft) as SheetId[]).map((sheet) => [sheet, draft[sheet].map((r) => r.cells)]),
      ) as Record<SheetId, string[][]>,
    [draft],
  );

  return {
    rows,
    columns,
    editing,
    changed,
    ruleKey,
    setCell,
    addRow,
    duplicateRow,
    deleteRow,
    restoreRow,
    addColumn,
    addedColumn,
    deleteColumn,
    restoreColumn,
    toggleEditing,
    save,
  };
}

export type RuleEdits = ReturnType<typeof useRuleEdits>;
