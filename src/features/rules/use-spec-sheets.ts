"use client";

import * as React from "react";
import { RETURN_BOXES, RETURN_BOX_COLUMNS } from "@/lib/mock/return-boxes";
import {
  DROPDOWN_COLUMNS,
  DROPDOWN_FIELDS,
  LIST_BOXES,
  LIST_BOX_COLUMNS,
  MANDATORY_COLUMNS,
  MANDATORY_FIELDS,
} from "@/lib/mock/spec-sheets";

export type SheetId = "boxes" | "lists" | "mandatory" | "dropdowns";
export type Row = Partial<Record<string, string>>;

/** One sheet of the spec workbook, as a tab: its columns in sheet order and
 *  what a row is called, for the label on each cell. */
export interface Sheet {
  id: SheetId;
  columns: readonly string[];
  rowName: string;
}

export const SHEETS: Sheet[] = [
  { id: "boxes", columns: RETURN_BOX_COLUMNS, rowName: "box_name" },
  { id: "lists", columns: LIST_BOX_COLUMNS, rowName: "subfield_name" },
  { id: "mandatory", columns: MANDATORY_COLUMNS, rowName: "field_name" },
  { id: "dropdowns", columns: DROPDOWN_COLUMNS, rowName: "value" },
];

const INITIAL: Record<SheetId, Row[]> = {
  boxes: RETURN_BOXES,
  lists: LIST_BOXES,
  mandatory: MANDATORY_FIELDS,
  dropdowns: DROPDOWN_FIELDS,
};

/** A row's key across every sheet — the sheet and the row's id. */
export const rowKey = (sheet: SheetId, row: Row, index: number) =>
  `${sheet}:${row.id ?? index}`;

/**
 * The four spec sheets while the expert works on them.
 *
 * Rows are read-only until opened for editing one at a time, so a stray click
 * in a forty-column table never changes the mapping. Edits collect in a draft;
 * nothing is kept until Save changes, and the count of changed rows is what
 * the footer shows beside it.
 */
export function useSpecSheets() {
  const [saved, setSaved] = React.useState(INITIAL);
  const [draft, setDraft] = React.useState(INITIAL);
  const [editing, setEditing] = React.useState<ReadonlySet<string>>(new Set());

  function setCell(sheet: SheetId, index: number, col: string, value: string) {
    setDraft((d) => ({
      ...d,
      [sheet]: d[sheet].map((row, i) => (i === index ? { ...row, [col]: value } : row)),
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
    for (const sheet of SHEETS) {
      draft[sheet.id].forEach((row, i) => {
        const before = saved[sheet.id][i] ?? {};
        const cols = new Set([...Object.keys(row), ...Object.keys(before)]);
        for (const col of cols) {
          if ((row[col] ?? "") !== (before[col] ?? "")) {
            keys.add(rowKey(sheet.id, row, i));
            break;
          }
        }
      });
    }
    return keys;
  }, [draft, saved]);

  function save() {
    setSaved(draft);
    setEditing(new Set());
  }

  return {
    rows: draft,
    editing,
    changed,
    setCell,
    toggleEditing,
    save,
  };
}

export type SpecSheets = ReturnType<typeof useSpecSheets>;
