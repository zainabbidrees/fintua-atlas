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
import {
  VIES_BOXES,
  VIES_DROPDOWN_FIELDS,
  VIES_LIST_BOXES,
  VIES_MANDATORY_FIELDS,
} from "@/lib/mock/vies-spec";

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
  { id: "lists", columns: LIST_BOX_COLUMNS, rowName: "column_name" },
  { id: "mandatory", columns: MANDATORY_COLUMNS, rowName: "field_name" },
  { id: "dropdowns", columns: DROPDOWN_COLUMNS, rowName: "value" },
];

type Workbook = Record<SheetId, Row[]>;

/* Rows are tracked by id, so a duplicate or a delete never shifts which row an
   edit belongs to. A row the source sheet left without one is given its place. */
const withIds = (book: Workbook): Workbook =>
  Object.fromEntries(
    (Object.keys(book) as SheetId[]).map((sheet) => [
      sheet,
      book[sheet].map((row, i) => (row.id ? row : { ...row, id: `${sheet}-${i + 1}` })),
    ]),
  ) as Workbook;

/** Each return type's spec workbook, keyed by return type. */
const SOURCE: Record<string, Workbook> = {
  "be-vat": {
    boxes: RETURN_BOXES,
    lists: LIST_BOXES,
    mandatory: MANDATORY_FIELDS,
    dropdowns: DROPDOWN_FIELDS,
  },
  "be-esl": {
    boxes: VIES_BOXES,
    lists: VIES_LIST_BOXES,
    mandatory: VIES_MANDATORY_FIELDS,
    dropdowns: VIES_DROPDOWN_FIELDS,
  },
};

const INITIAL: Record<string, Workbook> = Object.fromEntries(
  Object.entries(SOURCE).map(([type, book]) => [type, withIds(book)]),
);

/** Whether a return type has a spec workbook to show. */
export const hasSpec = (returnType: string) => returnType in INITIAL;

const EMPTY: Workbook = { boxes: [], lists: [], mandatory: [], dropdowns: [] };

/** The form page a box sits on. Not a column of the source sheet: it is set
 *  on the boxes the expert adds, so each one points back at the form. */
export const PAGE_COLUMN = "page_reference";

/** Boxes the expert added carry this id prefix, to tell them from extracted ones. */
export const ADDED_PREFIX = "added-";

/** A row's key across every sheet — the sheet and the row's id. */
export const rowKey = (sheet: SheetId, row: Row, index: number) =>
  `${sheet}:${row.id ?? index}`;

/**
 * The four spec sheets of every return type while the expert works on them,
 * showing the one for `returnType`.
 *
 * Rows are read-only until opened for editing one at a time, so a stray click
 * in a forty-column table never changes the mapping. Edits collect in a draft
 * per return type; nothing is kept until Save changes, which saves them all,
 * and the footer counts changed rows across every return type.
 */
export function useSpecSheets(
  returnType: string,
  /** The boxes last saved for this country, per return type — they replace
      the extracted ones, so coming back finds the field map as it was left. */
  stored: Record<string, Row[]> | null = null,
) {
  const [saved, setSaved] = React.useState(INITIAL);
  const [draft, setDraft] = React.useState(INITIAL);
  /* The store is read only after hydration, so its boxes are taken in once,
     the first time they arrive. */
  const [seeded, setSeeded] = React.useState(false);
  if (stored && !seeded) {
    setSeeded(true);
    const book = Object.fromEntries(
      Object.entries(INITIAL).map(([type, b]) => [type, { ...b, boxes: stored[type] ?? b.boxes }]),
    );
    setSaved(book);
    setDraft(book);
  }
  /* Keys are "returnType|sheet:row", so an open row stays with its type. */
  const [editing, setEditing] = React.useState<ReadonlySet<string>>(new Set());
  const prefix = `${returnType}|`;

  /* Columns the expert adds to a sheet, per return type, after the sheet's
     own. A new column is blank (or one value) in every row, so the rows count
     as changed until Save. */
  const [added, setAdded] = React.useState<Record<string, Partial<Record<SheetId, string[]>>>>({});
  /* List boxes and dropdown fields belong to calculated boxes: until a box of
     this return type has is_calculated ticked, those two sheets are not shown. */
  const calculated = (draft[returnType]?.boxes ?? []).some((row) => row.is_calculated === "TRUE");
  /* Any box of any return type calculated — what decides Query Builder. */
  const calculatedAnywhere = Object.values(draft).some((book) =>
    book.boxes.some((row) => row.is_calculated === "TRUE"),
  );
  const sheets = React.useMemo<Sheet[]>(
    () =>
      SHEETS.filter(
        (sheet) => calculated || (sheet.id !== "lists" && sheet.id !== "dropdowns"),
      ).map((sheet) => ({
        ...sheet,
        columns: [...sheet.columns, ...(added[returnType]?.[sheet.id] ?? [])],
      })),
    [added, returnType, calculated],
  );

  function addColumn(sheet: SheetId, name: string, value: string) {
    setAdded((a) => ({
      ...a,
      [returnType]: { ...a[returnType], [sheet]: [...(a[returnType]?.[sheet] ?? []), name] },
    }));
    setDraft((d) => {
      const book = d[returnType];
      if (!book) return d;
      return {
        ...d,
        [returnType]: { ...book, [sheet]: book[sheet].map((row) => ({ ...row, [name]: value })) },
      };
    });
  }

  function setCell(sheet: SheetId, index: number, col: string, value: string) {
    setDraft((d) => {
      const book = d[returnType];
      if (!book) return d;
      return {
        ...d,
        [returnType]: {
          ...book,
          [sheet]: book[sheet].map((row, i) => (i === index ? { ...row, [col]: value } : row)),
        },
      };
    });
  }

  /** Appends a box to the field map of the return type on show. It is a draft
   *  like any edit, so it counts as unsaved until Save changes. */
  function addBox(box: Row): string {
    const id = `${ADDED_PREFIX}${Date.now()}`;
    setDraft((d) => {
      const book = d[returnType];
      if (!book) return d;
      const template = book.boxes[0] ?? {};
      const row: Row = {
        id,
        iso_code: template.iso_code,
        return_type: template.return_type,
        is_active: "TRUE",
        /* Drawn as a checkbox, so the calculation can be switched on. */
        is_calculated: "FALSE",
        ...box,
      };
      return { ...d, [returnType]: { ...book, boxes: [...book.boxes, row] } };
    });
    return id;
  }

  /** Appends a row to one of the return type's sheets and returns its id. It
   *  is a draft like any edit, so it counts as unsaved until Save changes. */
  function addRow(sheet: SheetId, row: Row): string {
    const id = `${ADDED_PREFIX}${Date.now()}`;
    setDraft((d) => {
      const book = d[returnType];
      if (!book) return d;
      return { ...d, [returnType]: { ...book, [sheet]: [...book[sheet], { id, ...row }] } };
    });
    return id;
  }

  /** Copies a row in beneath itself and returns the copy's id. The copy's name
   *  is marked so the two are told apart, and it is unsaved until Save. */
  function duplicateRow(sheet: SheetId, index: number, nameColumn: string): string {
    const id = `${ADDED_PREFIX}${Date.now()}`;
    setDraft((d) => {
      const book = d[returnType];
      const source = book?.[sheet][index];
      if (!book || !source) return d;
      const name = source[nameColumn];
      const copy: Row = { ...source, id, ...(name ? { [nameColumn]: `${name}_copy` } : {}) };
      const rows = [...book[sheet]];
      rows.splice(index + 1, 0, copy);
      return { ...d, [returnType]: { ...book, [sheet]: rows } };
    });
    return id;
  }

  /** Takes a row out of the draft; `restoreRow` puts it back where it was. */
  function deleteRow(sheet: SheetId, index: number) {
    setDraft((d) => {
      const book = d[returnType];
      if (!book) return d;
      return {
        ...d,
        [returnType]: { ...book, [sheet]: book[sheet].filter((_, i) => i !== index) },
      };
    });
  }

  function restoreRow(sheet: SheetId, index: number, row: Row) {
    setDraft((d) => {
      const book = d[returnType];
      if (!book || book[sheet].some((r) => r.id === row.id)) return d;
      const rows = [...book[sheet]];
      rows.splice(index, 0, row);
      return { ...d, [returnType]: { ...book, [sheet]: rows } };
    });
  }

  /** Opens a row of any return type — to send the expert to it from elsewhere. */
  function openRow(type: string, key: string) {
    setEditing((prev) => new Set(prev).add(`${type}|${key}`));
  }

  function toggleEditing(key: string) {
    setEditing((prev) => {
      const next = new Set(prev);
      if (next.has(prefix + key)) next.delete(prefix + key);
      else next.add(prefix + key);
      return next;
    });
  }

  /** Keys ("returnType|sheet:row") of every row whose draft differs from the
   *  last save — edited, added, or deleted. Matched by id, not position. */
  const changedAll = React.useMemo(() => {
    const keys = new Set<string>();
    for (const [type, book] of Object.entries(draft)) {
      for (const sheet of SHEETS) {
        const before = new Map((saved[type]?.[sheet.id] ?? []).map((r) => [r.id, r]));
        book[sheet.id].forEach((row, i) => {
          const was = before.get(row.id) ?? {};
          before.delete(row.id);
          const cols = new Set([...Object.keys(row), ...Object.keys(was)]);
          for (const col of cols) {
            if ((row[col] ?? "") !== (was[col] ?? "")) {
              keys.add(`${type}|${rowKey(sheet.id, row, i)}`);
              break;
            }
          }
        });
        /* Whatever is left was deleted since the save — still a change to keep. */
        for (const id of before.keys()) keys.add(`${type}|${sheet.id}:${id}`);
      }
    }
    return keys;
  }, [draft, saved]);

  /** Strips the return type off the keys that belong to the one on show. */
  const forType = (keys: ReadonlySet<string>) =>
    new Set([...keys].filter((k) => k.startsWith(prefix)).map((k) => k.slice(prefix.length)));

  /** Keeps the draft and hands back every return type's boxes as saved. */
  function save(): Record<string, Row[]> {
    setSaved(draft);
    setEditing(new Set());
    return Object.fromEntries(Object.entries(draft).map(([type, book]) => [type, book.boxes]));
  }

  return {
    /** The sheets of the return type on show, with any added columns: all
     *  four once a box is calculated, else the field map and mandatory fields. */
    sheets,
    calculatedAnywhere,
    /** Boxes ticked is_calculated with no calculation written, in every
     *  return type — each holds the step back until written or unticked. */
    missingCalculations: Object.entries(draft).flatMap(([type, book]) =>
      book.boxes.flatMap((row, i) =>
        row.is_calculated === "TRUE" && !(row.calculation ?? "").trim()
          ? [{ returnType: type, name: row.box_name ?? "", key: rowKey("boxes", row, i) }]
          : [],
      ),
    ),
    openRow,
    rows: draft[returnType] ?? EMPTY,
    editing: forType(editing),
    changed: forType(changedAll),
    /** Changed rows across every return type, for the footer. */
    unsaved: changedAll.size,
    setCell,
    addBox,
    addRow,
    addColumn,
    duplicateRow,
    deleteRow,
    restoreRow,
    toggleEditing,
    save,
  };
}

export type SpecSheets = ReturnType<typeof useSpecSheets>;
