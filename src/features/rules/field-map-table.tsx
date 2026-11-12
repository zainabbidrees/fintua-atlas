"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Check, ChevronDown, Columns3, Copy, FileSearch, MoreHorizontal, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { AddColumnDialog } from "@/components/patterns/add-column-dialog";
import { ConfirmWithReason } from "@/components/patterns/confirm-with-reason";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useReadOnly } from "@/components/patterns/read-only";
import {
  ListFilter,
  NoMatch,
  Pagination,
  matches,
  usePaged,
} from "@/components/patterns/list-controls";
import { TabPanel, Tabs } from "@/components/ui/tabs";
import { SourceBlock } from "@/components/domain/source-block";
import { cn } from "@/lib/cn";
import { copy, fill } from "@/lib/copy";
import { BOX_SOURCES, type SourcedColumn } from "@/lib/mock/box-sources";
import { FLAG_COLUMNS } from "@/lib/mock/return-boxes";
import type { Evidence } from "@/lib/types";
import {
  PAGE_COLUMN,
  rowKey,
  type Row,
  type Sheet,
  type SpecSheets,
} from "./use-spec-sheets";

/* Flag columns across every sheet — a checkbox wherever the cell holds TRUE
   or FALSE. */
const FLAGS: ReadonlySet<string> = new Set([
  ...FLAG_COLUMNS,
  "is_mandatory",
  "is_default",
]);

/* Every column follows one rule: left-aligned, text on one shared edge, width
   from its header plus equal padding, rounded to the 8px grid. Mixing right,
   centre and left alignment in one header row is what made it read as ragged.
   These are the columns whose content, not their header, sets the width. */
const CONTENT_WIDTH: Partial<Record<string, number>> = {
  box_name: 144,
  subfield_name: 248,
  column_name: 248,
  display_name: 112,
  field_name: 224,
  submission_type: 136,
  source_column: 344,
  condition: 296,
  error_message: 400,
  label: 296,
  label_local_language: 320,
  return_type: 152,
  start_date: 104,
  end_date: 104,
  return_box_description: 320,
  return_box_description_local_language: 320,
  calculation: 360,
  group_by: 320,
  condition_script: 240,
  info_note: 240,
};

/* Codes and orders keep tabular figures so digits sit in step, but stay
   left-aligned: they are identifiers to read, not amounts to compare. */
const NUMERIC: ReadonlySet<string> = new Set([
  PAGE_COLUMN,
  "return_box_value",
  "max_length",
  "position_nr",
  "rounding_method",
  "calculation_order",
  "wts_field_id",
]);

/* Only the SQL itself is set in the mono face; names, labels and headers stay
   in Mona Sans like the rest of the app. */
const CODE: ReadonlySet<string> = new Set([
  "calculation",
  "group_by",
  "condition_script",
  "condition",
  "source_column",
]);

/* The text edge sits 13px into every column: the header pads 13px; a cell pads
   6px and its input adds a 1px border and 6px padding. The first column pads
   3px more so the table lines up with the card's 16px title. */
const HEAD_PAD = "px-[13px] first:pl-4";
const CELL_PAD = "px-1.5 first:pl-[9px]";
/* A checkbox has no input around it, so it takes the input's 7px itself. */
const FLAG_INSET = "pl-[7px]";

/* Header labels are 12px Mona Sans at medium weight: about 6.4px a character at the widest. */
const GRID = 8;
const MIN_WIDTH = 64;

/* Columns that name a field-map box, and which boxes each may name: a list
   box's columns belong to a box ticked is_list, a mandatory field is any box,
   a dropdown value belongs to a box whose field_type is drop-down. Read from
   the draft, so a box just added or switched over is offered straight away. */
const BOX_PICKERS: Partial<Record<Sheet["id"], { col: string; offers: (box: Row) => boolean }>> = {
  lists: { col: "box_name", offers: (box) => box.is_list === "TRUE" },
  mandatory: { col: "field_name", offers: () => true },
  dropdowns: {
    col: "field_name",
    offers: (box) => (box.field_type ?? "").toLowerCase() === "drop-down",
  },
};

function columnWidth(col: string): number {
  const fromHeader = Math.ceil(col.length * 6.4) + 26;
  const raw = Math.max(MIN_WIDTH, fromHeader, CONTENT_WIDTH[col] ?? 0);
  return Math.ceil(raw / GRID) * GRID;
}

type Column = { col: string; sheetIndex: number };

/* A sheet's internal row id (column A) is not shown: it is a database key,
   not something the expert reads or corrects. Every other column keeps its
   sheet letter, so a cell still traces back to the source. */
function visibleColumns(sheet: Sheet): Column[] {
  const columns = sheet.columns
    .map((col, sheetIndex) => ({ col, sheetIndex }))
    .filter(({ col }) => col !== "id");
  /* The field map also carries the form page each box sits on, right after
     the pinned name. It is not a sheet column, so it has no letter (-1). */
  if (sheet.id === "boxes") columns.splice(PINNED, 0, { col: PAGE_COLUMN, sheetIndex: -1 });
  return columns;
}

/* The row's edit control leads every row, in a narrow column of its own, so it
   is reachable at any scroll position and sits beside the name it edits. */
const EDIT_W = 112;
/* With a leading sources mark the cluster holds four actions, so the column is
   a touch wider. A reviewer has only the sources mark, so theirs is narrow. */
const EDIT_W_SOURCED = 144;
const SOURCES_ONLY_W = 48;
const ACTION =
  "inline-flex size-8 shrink-0 items-center justify-center rounded-md transition-[background-color,color,transform] active:scale-[0.94]";

/* After it, the first two columns — on the field map, iso_code and box_name —
   stay put while the rest scroll sideways, so every row keeps its name in view
   across forty columns. A hairline on the last one marks where the scrolling
   starts. Pinned cells carry their row's background, so a tinted row stays
   tinted under them. */
const PINNED = 2;

function pinned(
  columns: Column[],
  index: number,
  background = "bg-surface",
  /* The actions column's width: none when read only, where it is left out. */
  editW = EDIT_W,
): { className?: string; style?: React.CSSProperties } {
  if (index >= PINNED) return {};
  const left =
    editW + columns.slice(0, index).reduce((sum, c) => sum + columnWidth(c.col), 0);
  return {
    className: cn(
      "sticky z-[1]",
      background,
      index === PINNED - 1 && "shadow-[inset_-1px_0_0_var(--border-strong)]",
    ),
    style: { left },
  };
}

/* The sheet's column letters, A to AO, so a cell can be traced back. */
function columnLetter(index: number): string {
  let n = index + 1;
  let out = "";
  while (n > 0) {
    const r = (n - 1) % 26;
    out = String.fromCharCode(65 + r) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

/**
 * The field map under the form preview, and the three sheets that sit beside
 * it in the spec workbook — list boxes, mandatory fields, dropdown fields.
 *
 * Each tab is one sheet as the source holds it: one row per entry, every column
 * in sheet order. A row is read until its pencil opens it for editing; edits
 * are held as a draft until Save changes in the footer. The SQL spec
 * downstream is built from all four sheets.
 */
export function FieldMapTable({
  s,
  onAddBox,
  onAddValue,
  reveal = 0,
  revealValues = 0,
}: {
  s: SpecSheets;
  /** Opens the Add box dialog; the field map tab shows the button when given. */
  onAddBox?: () => void;
  /** Opens the Add value dialog; the dropdown tab shows the button when given. */
  onAddValue?: () => void;
  /** Bumped after a box is added: the field map tab opens on its last page. */
  reveal?: number;
  /** Bumped after a dropdown value is added: that tab opens on its last page. */
  revealValues?: number;
}) {
  const t = copy.fieldMap;
  const [chosen, setTab] = React.useState<Sheet["id"]>("boxes");
  /* A tab that has gone — its sheets hide once no box is calculated — falls
     back to the field map. */
  const tab = s.sheets.some((sheet) => sheet.id === chosen) ? chosen : "boxes";

  /* The row waiting on a reason before it is deleted. */
  const [deleting, setDeleting] = React.useState<RowRef | null>(null);

  function act(action: RowAction, ref: RowRef) {
    if (action === "delete") {
      setDeleting(ref);
      return;
    }
    const id = s.duplicateRow(ref.sheet.id, ref.index, ref.sheet.rowName);
    /* Open the copy, so the expert can change what makes it different. */
    s.toggleEditing(rowKey(ref.sheet.id, { id }, 0));
    toast(fill(t.duplicated, { name: ref.name }));
  }

  function confirmDelete(reason: string) {
    if (!deleting) return;
    const { sheet, index, row, name } = deleting;
    s.deleteRow(sheet.id, index);
    toast(fill(t.deleted, { name }), {
      description: fill(t.deletedReason, { reason }),
      action: { label: t.undo, onClick: () => s.restoreRow(sheet.id, index, row) },
    });
  }

  /* A new box lands at the end of the field map, so bring that tab forward. */
  const [revealed, setRevealed] = React.useState(reveal);
  if (reveal !== revealed) {
    setRevealed(reveal);
    setTab("boxes");
  }
  const [revealedValues, setRevealedValues] = React.useState(revealValues);
  if (revealValues !== revealedValues) {
    setRevealedValues(revealValues);
    setTab("dropdowns");
  }

  return (
    <section
      id="field-map"
      className="scroll-mt-6 overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-raised)]"
    >
      <div className="px-4 pt-4">
        <Tabs
          idBase="spec-sheet"
          value={tab}
          onValueChange={(id) => setTab(id as Sheet["id"])}
          tabs={s.sheets.map((sheet) => ({
            id: sheet.id,
            label: t.tabs[sheet.id],
            count: s.rows[sheet.id].length,
          }))}
        />
      </div>

      {s.sheets.map((sheet) => (
        <TabPanel
          key={sheet.id}
          id={sheet.id}
          idBase="spec-sheet"
          className={cn(sheet.id !== tab && "hidden")}
        >
          <SheetTable
            sheet={sheet}
            s={s}
            reveal={sheet.id === "boxes" ? reveal : sheet.id === "dropdowns" ? revealValues : 0}
            onAdd={sheet.id === "boxes" ? onAddBox : sheet.id === "dropdowns" ? onAddValue : undefined}
            addLabel={sheet.id === "boxes" ? copy.fieldMap.addBox : copy.fieldMap.addRow}
            onAction={act}
          />
        </TabPanel>
      ))}

      {/* Deleting keeps its why — the same pattern as every other removal. */}
      <ConfirmWithReason
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={fill(t.deleteTitle, { name: deleting?.name ?? "" })}
        hint={t.deleteHint}
        placeholder={t.deletePlaceholder}
        confirmLabel={t.deleteConfirm}
        cancelLabel={t.deleteCancel}
        onConfirm={confirmDelete}
      />
    </section>
  );
}

type RowAction = "duplicate" | "delete";
/** A row as an action needs it: where it is, what it holds, what it is called. */
type RowRef = { sheet: Sheet; index: number; row: Row; name: string };

/* Each sheet filters and pages on its own, so switching tabs keeps your place.
   Rows carry their index in the full sheet, which is what edits are keyed on. */
function SheetTable({
  sheet,
  s,
  reveal,
  onAdd,
  addLabel,
  onAction,
}: {
  sheet: Sheet;
  s: SpecSheets;
  reveal: number;
  onAdd?: () => void;
  addLabel: string;
  onAction: (action: RowAction, ref: RowRef) => void;
}) {
  const [term, setTerm] = React.useState("");
  const readOnly = useReadOnly();
  /* Every sheet but the field map takes new columns; the field map's columns
     are the source schema. */
  const growable = sheet.id !== "boxes";
  const [addingColumn, setAddingColumn] = React.useState(false);
  /* Bumped when a row or column is added here, to bring it into view. */
  const [added, setAdded] = React.useState(0);
  const [shownAdded, setShownAdded] = React.useState(0);
  const entries = s.rows[sheet.id]
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => matches(term, Object.values(row)));
  const paged = usePaged(entries);

  /* After an add: drop the filter and go to the last page, where the new row
     is. The page is clamped, so asking for one past the end lands there. */
  const [revealed, setRevealed] = React.useState(reveal);
  if (reveal !== revealed || added !== shownAdded) {
    setRevealed(reveal);
    setShownAdded(added);
    setTerm("");
    paged.setPage(Number.MAX_SAFE_INTEGER);
  }

  /* A blank row at the end, open, so it can be filled straight away. The
     dropdown sheet adds through its own form instead (`onAdd`), which asks
     for the drop-down box first. */
  function addBlankRow() {
    const id = s.addRow(sheet.id, {});
    s.toggleEditing(rowKey(sheet.id, { id }, 0));
    setAdded((n) => n + 1);
    toast(fill(copy.fieldMap.rowAdded, { sheet: copy.fieldMap.tabs[sheet.id] }));
  }

  function addColumn(column: { name: string; value: string }) {
    const letter = columnLetter(sheet.columns.length);
    s.addColumn(sheet.id, column.name, column.value);
    toast(fill(copy.fieldMap.columnAdded, { name: column.name, letter }));
  }

  return (
    <>
      <ListFilter
        className="border-b border-border px-4 py-3"
        leading={
          <p className="text-[13px] text-text-muted" data-numeric>
            {fill(copy.fieldMap.hints[sheet.id], { count: s.rows[sheet.id].length })}
          </p>
        }
        value={term}
        onChange={(v) => {
          setTerm(v);
          paged.setPage(1);
        }}
        placeholder={copy.list.filterRows}
        actions={
          !readOnly &&
          (onAdd || growable) && (
            <div className="flex shrink-0 gap-2">
              {growable && (
                <Button
                  variant="secondary"
                  onClick={() => setAddingColumn(true)}
                  className="h-9 active:scale-[0.98]"
                >
                  <Columns3 />
                  {copy.fieldMap.addColumn}
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={onAdd ?? addBlankRow}
                className="h-9 active:scale-[0.98]"
              >
                <Plus />
                {addLabel}
              </Button>
            </div>
          )
        }
      />
      {growable && (
        <AddColumnDialog
          open={addingColumn}
          sheetName={copy.fieldMap.tabs[sheet.id]}
          columns={sheet.columns}
          letter={columnLetter(sheet.columns.length)}
          onOpenChange={setAddingColumn}
          onAdd={addColumn}
        />
      )}
      {entries.length === 0 ? (
        <NoMatch query={term} onClear={() => setTerm("")} />
      ) : (
        <SheetGrid sheet={sheet} s={s} entries={paged.items} onAction={onAction} />
      )}
      <Pagination
        className="border-t border-border px-4 py-3"
        page={paged.page}
        pages={paged.pages}
        onPageChange={paged.setPage}
      />
    </>
  );
}

function SheetGrid({
  sheet,
  s,
  entries,
  onAction,
}: {
  sheet: Sheet;
  s: SpecSheets;
  entries: { row: Row; index: number }[];
  onAction: (action: RowAction, ref: RowRef) => void;
}) {
  const columns = visibleColumns(sheet);
  /* Read only, the edit actions are not there. The field map still keeps a
     narrow actions column for the sources mark — the one action a reviewer has
     — but every other sheet drops the column, and its first data column then
     takes the card's inset. */
  const readOnly = useReadOnly();
  /* Only the field map carries sources; its boxes all cite at least a rounding
     rule, so the column is present whenever the field map is shown. */
  const sheetHasSources = sheet.id === "boxes";
  const editW = readOnly
    ? sheetHasSources
      ? SOURCES_ONLY_W
      : 0
    : sheetHasSources
      ? EDIT_W_SOURCED
      : EDIT_W;
  const tableWidth = editW + columns.reduce((sum, c) => sum + columnWidth(c.col), 0);
  const picker = BOX_PICKERS[sheet.id];
  const boxNames = picker
    ? [...new Set(s.rows.boxes.filter(picker.offers).map((b) => b.box_name ?? "").filter(Boolean))]
    : [];

  /* The box whose sources are open — its calculation and rounding read side by
     side in one drawer, each as the document it came from. */
  const [openBox, setOpenBox] = React.useState<{
    name: string;
    sources: Partial<Record<SourcedColumn, Evidence>>;
  } | null>(null);

  return (
    /* Scrolls sideways only — the page scrolls down, so there is never a
       second vertical scrollbar inside the card. Fixed layout with set
       widths, so forty-one headers never bunch. */
    <div className="overflow-x-auto [scrollbar-width:thin]">
      <table
        className="table-fixed border-separate border-spacing-0 text-[13px]"
        style={{ width: tableWidth }}
      >
        <colgroup>
          {editW > 0 && <col style={{ width: editW }} />}
          {columns.map(({ col }) => (
            <col key={col} style={{ width: columnWidth(col) }} />
          ))}
        </colgroup>
        <thead className="bg-surface">
          <tr className="text-left">
            {editW > 0 && (
              <th className="sticky left-0 z-[1] border-b border-border bg-surface">
                <span className="sr-only">{copy.fieldMap.actionsColumn}</span>
              </th>
            )}
            {columns.map(({ col, sheetIndex }, i) => (
              <th
                key={col}
                style={pinned(columns, i, undefined, editW).style}
                className={cn(
                  "border-b border-border pb-2.5 pt-3 align-bottom font-medium",
                  HEAD_PAD,
                  pinned(columns, i, undefined, editW).className,
                )}
              >
                <span className="block text-[11px] leading-4 text-text-faint" data-numeric>
                  {sheetIndex < 0 ? "\u00a0" : columnLetter(sheetIndex)}
                </span>
                <span className="block truncate text-[12px] leading-4 text-text-muted" title={col}>
                  {col === PAGE_COLUMN ? copy.fieldMap.pageColumn : col}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {entries.map(({ row, index: r }) => {
            const key = rowKey(sheet.id, row, r);
            const name =
              row[sheet.rowName] || fill(copy.fieldMap.rowFallback, { n: r + 1 });
            const ref = { sheet, index: r, row, name };
            return (
              <SheetRow
                key={key}
                row={row}
                columns={columns}
                picker={picker && { col: picker.col, options: boxNames }}
                sources={sheetHasSources ? BOX_SOURCES[row.box_name ?? ""] : undefined}
                editW={editW}
                onOpenSources={() => {
                  const sources = BOX_SOURCES[row.box_name ?? ""];
                  if (sources) setOpenBox({ name, sources });
                }}
                name={name}
                editing={s.editing.has(key)}
                changed={s.changed.has(key)}
                onToggleEditing={() => s.toggleEditing(key)}
                onDuplicate={() => onAction("duplicate", ref)}
                onDelete={() => onAction("delete", ref)}
                onCellChange={(col, value) => s.setCell(sheet.id, r, col, value)}
              />
            );
          })}
        </tbody>
      </table>
      {/* One drawer for the sheet: the box whose sources mark was clicked, its
          cited values read side by side. */}
      {openBox && (
        <BoxSourcesDrawer
          name={openBox.name}
          sources={openBox.sources}
          open
          onOpenChange={(open) => !open && setOpenBox(null)}
        />
      )}
    </div>
  );
}

function SheetRow({
  row,
  columns,
  picker,
  sources,
  editW,
  onOpenSources,
  name,
  editing,
  changed,
  onToggleEditing,
  onDuplicate,
  onDelete,
  onCellChange,
}: {
  row: Row;
  columns: Column[];
  /** The column chosen from the field map's boxes, and the boxes it offers. */
  picker?: { col: string; options: string[] };
  /** This box's captured sources, by column. Field map rows only. */
  sources?: Partial<Record<SourcedColumn, Evidence>>;
  /** The actions column's width — 0 when it is not shown at all. */
  editW: number;
  /** Opens the sources drawer for this box. */
  onOpenSources: () => void;
  name: string;
  editing: boolean;
  changed: boolean;
  onToggleEditing: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onCellChange: (col: string, value: string) => void;
}) {
  const t = copy.fieldMap;
  /* A reviewer reads every row; the edit actions are the expert's, but the
     sources are everyone's — a reviewer is exactly who reads them. */
  const readOnly = useReadOnly();
  const hasSources = !!sources && Object.keys(sources).length > 0;
  /* The row open for editing is tinted, so it is plain which one the inputs
     belong to. */
  const background = editing ? "bg-brand-quiet" : "bg-surface";

  return (
    <tr className={background}>
      {/* Sources, Edit, Duplicate, Delete — the row's own actions, always in
          reach. While the row is open the edits give way to its one tick, so
          the only thing to do there is finish; the sources stay, to check a
          value against its passage while editing it. Delete is the risk colour
          on hover only: at rest the actions are equal and quiet. */}
      {editW > 0 && (
        <td className={cn("sticky left-0 z-[1] border-b border-border py-1.5 pl-2", background)}>
          <span className="relative flex items-center gap-0.5">
            {hasSources && (
              <button
                type="button"
                onClick={onOpenSources}
                aria-label={fill(t.sourcesRow, { name })}
                title={fill(t.sourcesRow, { name })}
                className={cn(ACTION, "text-text-faint hover:bg-brand-quiet hover:text-brand")}
              >
                <FileSearch className="size-4" strokeWidth={1.75} />
              </button>
            )}
            {!readOnly && (
              <button
                type="button"
                onClick={onToggleEditing}
                aria-pressed={editing}
                aria-label={fill(editing ? t.doneEditing : t.editRow, { name })}
                title={fill(editing ? t.doneEditing : t.editRow, { name })}
                className={cn(
                  ACTION,
                  editing
                    ? "bg-brand text-on-brand hover:bg-brand-hover"
                    : "text-text-faint hover:bg-wash hover:text-text",
                )}
              >
                {editing ? <Check className="size-4" /> : <Pencil className="size-3.5" />}
              </button>
            )}
            {!readOnly && !editing && (
              <>
                <button
                  type="button"
                  onClick={onDuplicate}
                  aria-label={fill(t.duplicateRow, { name })}
                  title={fill(t.duplicateRow, { name })}
                  className={cn(ACTION, "text-text-faint hover:bg-wash hover:text-text")}
                >
                  <Copy className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={onDelete}
                  aria-label={fill(t.deleteRow, { name })}
                  title={fill(t.deleteRow, { name })}
                  className={cn(ACTION, "text-text-faint hover:bg-risk-quiet hover:text-risk")}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </>
            )}
            {/* An unsaved change, marked on the row it lives in. Offset past the
                sources mark when one leads the cluster. */}
            {changed && !editing && !readOnly && (
              <span
                aria-label={t.unsavedRow}
                className={cn(
                  "absolute top-0.5 size-1.5 rounded-full bg-brand",
                  hasSources ? "left-[60px]" : "left-[26px]",
                )}
              />
            )}
          </span>
        </td>
      )}
      {columns.map(({ col }, i) => {
        const value = row[col] ?? "";
        const isFlag = FLAGS.has(col) && (value === "TRUE" || value === "FALSE");
        /* A box's calculation is written only while it is calculated: the
           field opens with is_calculated ticked, and unticking clears it. */
        const locked = col === "calculation" && row.is_calculated !== "TRUE";
        /* Ticked but not yet written: the calculation is owed before moving on. */
        const owed = col === "calculation" && row.is_calculated === "TRUE" && !value.trim();
        return (
          <td
            key={col}
            style={pinned(columns, i, background, editW).style}
            className={cn(
              "border-b border-border py-1.5 align-middle",
              CELL_PAD,
              pinned(columns, i, background, editW).className,
            )}
          >
            {isFlag ? (
              <div className={cn("flex h-8 items-center", FLAG_INSET)}>
                <Checkbox
                  checked={value === "TRUE"}
                  disabled={!editing}
                  onCheckedChange={(v) => {
                    onCellChange(col, v === true ? "TRUE" : "FALSE");
                    if (col === "is_calculated" && v !== true) onCellChange("calculation", "");
                  }}
                  aria-label={`${col} ${name}`}
                  /* Read-only reads as a plain tick, not a dimmed, broken one. */
                  className="disabled:cursor-default disabled:opacity-100"
                />
              </div>
            ) : owed && !editing && !readOnly ? (
              <button
                type="button"
                onClick={onToggleEditing}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-attention-edge bg-attention-fill px-2.5 text-[13px] font-medium text-on-attention transition-colors hover:bg-attention-fill-hover"
              >
                <Plus className="size-3.5" />
                {t.addCalculation}
              </button>
            ) : editing && picker?.col === col ? (
              <CellSelect
                value={value}
                options={picker.options}
                onChange={(v) => onCellChange(col, v)}
                aria-label={`${col} ${name}`}
              />
            ) : (
              <CellInput
                /* The SQL holds line breaks; a single-line cell shows it on one
                   line, with the full text on hover. */
                value={editing ? value : value.replace(/\s*\n\s*/g, " ")}
                onChange={(e) => onCellChange(col, e.target.value)}
                readOnly={!editing || locked}
                tabIndex={editing && !locked ? undefined : -1}
                title={value || (editing && locked ? copy.fieldMap.calculationLocked : undefined)}
                aria-label={`${col} ${name}`}
                placeholder={
                  editing && locked
                    ? copy.fieldMap.calculationLocked
                    : editing && owed
                      ? copy.fieldMap.calculationOwed
                      : copy.fieldMap.empty
                }
                aria-invalid={editing && owed ? true : undefined}
                autoFocus={editing && owed}
                data-numeric={NUMERIC.has(col) ? "" : undefined}
                className={cn(
                  CODE.has(col) && "font-mono text-[12px]",
                  editing && owed && "border-attention-edge",
                )}
              />
            )}
          </td>
        );
      })}
    </tr>
  );
}

/**
 * Where a box's cited values came from, read side by side.
 *
 * Two cells are decided from a source rather than transcribed — the calculation
 * and whether the box is rounded — so the drawer gives each its own section:
 * the document it was taken from, as a real link to the PDF or page, and the
 * verbatim wording the value rests on, so the rule can be checked against the
 * source rather than taken on trust. Ordered as the columns are, calculation
 * before rounding.
 */
const SOURCE_ORDER: SourcedColumn[] = ["calculation", "is_rounded"];

function BoxSourcesDrawer({
  name,
  sources,
  open,
  onOpenChange,
}: {
  name: string;
  sources: Partial<Record<SourcedColumn, Evidence>>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = copy.fieldMap;
  const entries = SOURCE_ORDER.flatMap((col) => {
    const evidence = sources[col];
    return evidence ? [{ col, evidence }] : [];
  });

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-text/25 backdrop-blur-[1px]",
            "data-[state=open]:[animation:overlay-in_240ms_ease]",
            "data-[state=closed]:[animation:overlay-out_180ms_ease]",
          )}
        />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={cn(
            "fixed inset-y-0 right-0 z-50 flex w-[min(34rem,calc(100vw-1.5rem))] flex-col",
            "border-l border-border bg-surface shadow-[var(--shadow-overlay)] focus:outline-none",
            "data-[state=open]:[animation:drawer-in_320ms_cubic-bezier(0.16,1,0.3,1)]",
            "data-[state=closed]:[animation:drawer-out_220ms_cubic-bezier(0.3,0,0.8,0.15)]",
          )}
        >
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-6 py-4">
            <div className="min-w-0">
              <DialogPrimitive.Title className="text-[15px] font-medium text-text">
                {t.sourcesTitle}
              </DialogPrimitive.Title>
              <p className="mt-1 text-[13px] text-text-muted">{fill(t.sourcesSubtitle, { name })}</p>
            </div>
            <DialogPrimitive.Close
              aria-label={t.sourcesClose}
              className="-mr-1 grid size-8 shrink-0 place-items-center rounded-md text-text-faint transition-colors hover:bg-wash hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
            >
              <X className="size-4" />
            </DialogPrimitive.Close>
          </div>

          <div className="min-h-0 flex-1 space-y-8 overflow-y-auto px-6 py-6">
            {entries.map(({ col, evidence }) => (
              <SourceSection key={col} col={col} evidence={evidence} />
            ))}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/**
 * One cited cell, read as a precise citation: the document, its exact locator,
 * and the verbatim wording — then, behind a quiet dots control, the surrounding
 * passage with the quote highlighted where it appears. The passage is optional,
 * the same as in the returns drawer, so the exact wording always leads.
 */
function SourceSection({ col, evidence }: { col: SourcedColumn; evidence: Evidence }) {
  const [showContext, setShowContext] = React.useState(false);
  return (
    <section>
      {/* Which cell this source stands behind, named as its column. */}
      <h3 className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-faint">
        {copy.fieldMap.sourceColumnLabel[col]}
      </h3>
      {/* The document itself — a real link to the PDF or page. */}
      <SourceBlock
        className="mt-2"
        url={evidence.url}
        title={evidence.sourceTitle}
        meta={[evidence.publisher, evidence.locator]}
      />
      {/* The verbatim wording the value rests on. */}
      <figure className="mt-3 border-l-2 border-brand-edge bg-brand-quiet/50 py-3 pl-4 pr-3">
        <figcaption className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-faint">
          {copy.sources.exactQuoteLabel}
        </figcaption>
        <blockquote className="mt-1.5 text-[14px] font-medium leading-relaxed text-text">
          {evidence.quote}
        </blockquote>
      </figure>

      {/* The surrounding passage, behind a dots control and only when captured. */}
      {evidence.article && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowContext((v) => !v)}
            aria-expanded={showContext}
            className="inline-flex items-center gap-2 rounded-md text-[13px] font-medium text-text-muted transition-colors hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
          >
            <MoreHorizontal className="size-4 text-text-faint" strokeWidth={2} />
            {showContext ? copy.sources.hideContext : copy.sources.showContext}
          </button>
          {showContext && (
            <div className="mt-3 max-w-[58ch] space-y-4 border-t border-border pt-4 text-[14px] leading-relaxed text-text-muted">
              {evidence.article.split("\n\n").map((p, i) => (
                <p key={i}>{highlightQuote(p, evidence.quote)}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/** Wraps `quote` in a highlight where it appears in the paragraph. */
function highlightQuote(paragraph: string, quote: string) {
  const at = paragraph.indexOf(quote);
  if (at === -1) return paragraph;
  return (
    <>
      {paragraph.slice(0, at)}
      <mark className="rounded bg-brand-quiet px-1 py-0.5 font-medium text-text ring-1 ring-inset ring-brand-edge [box-decoration-break:clone] [-webkit-box-decoration-break:clone]">
        {quote}
      </mark>
      {paragraph.slice(at + quote.length)}
    </>
  );
}

/**
 * A cell chosen from a closed list, shown only while its row is open. A value
 * the list no longer offers — its box unticked or renamed in the field map — is
 * kept and marked, so opening a row never silently changes it.
 */
function CellSelect({
  value,
  options,
  onChange,
  "aria-label": label,
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  "aria-label": string;
}) {
  const stale = value !== "" && !options.includes(value);
  return (
    <span className="relative block">
      <select
        value={value}
        aria-label={label}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-full appearance-none truncate rounded-md border border-brand-edge bg-surface pl-1.5 pr-6 text-[13px] text-text transition-colors focus:border-brand focus:outline-none"
      >
        {value === "" && (
          <option value="" disabled>
            {copy.fieldMap.chooseBox}
          </option>
        )}
        {stale && (
          <option value={value}>{fill(copy.fieldMap.notInFieldMap, { name: value })}</option>
        )}
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-1.5 top-1/2 size-3.5 -translate-y-1/2 text-text-faint"
      />
    </span>
  );
}

/** A text cell: plain text while the row is read, a visible field once open. */
function CellInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="text"
      className={cn(
        "h-8 w-full truncate rounded-md border px-1.5 text-[13px] text-text transition-colors placeholder:text-text-faint focus:outline-none",
        props.readOnly
          ? "cursor-default border-transparent bg-transparent"
          : "border-brand-edge bg-surface focus:border-brand",
        className,
      )}
      {...props}
    />
  );
}
