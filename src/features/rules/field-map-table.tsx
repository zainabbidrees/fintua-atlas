"use client";

import * as React from "react";
import { Check, Copy, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
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
import { cn } from "@/lib/cn";
import { copy, fill } from "@/lib/copy";
import { FLAG_COLUMNS } from "@/lib/mock/return-boxes";
import {
  PAGE_COLUMN,
  SHEETS,
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
): { className?: string; style?: React.CSSProperties } {
  if (index >= PINNED) return {};
  const left =
    EDIT_W + columns.slice(0, index).reduce((sum, c) => sum + columnWidth(c.col), 0);
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
  const [tab, setTab] = React.useState<Sheet["id"]>("boxes");

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
          tabs={SHEETS.map((sheet) => ({
            id: sheet.id,
            label: t.tabs[sheet.id],
            count: s.rows[sheet.id].length,
          }))}
        />
      </div>

      {SHEETS.map((sheet) => (
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
            addLabel={sheet.id === "dropdowns" ? copy.fieldMap.addValue : copy.fieldMap.addBox}
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
  const entries = s.rows[sheet.id]
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => matches(term, Object.values(row)));
  const paged = usePaged(entries);

  /* After an add: drop the filter and go to the last page, where the new row
     is. The page is clamped, so asking for one past the end lands there. */
  const [revealed, setRevealed] = React.useState(reveal);
  if (reveal !== revealed) {
    setRevealed(reveal);
    setTerm("");
    paged.setPage(Number.MAX_SAFE_INTEGER);
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
          onAdd && !readOnly && (
            <Button
              variant="secondary"
              onClick={onAdd}
              className="h-9 shrink-0 active:scale-[0.98]"
            >
              <Plus />
              {addLabel}
            </Button>
          )
        }
      />
      {entries.length === 0 ? (
        <NoMatch query={term} onClear={() => setTerm("")} />
      ) : (
        <SheetGrid sheet={sheet} s={s} entries={paged.items} onAction={onAction} />
      )}
      <Pagination
        className="border-t border-border px-4 py-3"
        page={paged.page}
        pages={paged.pages}
        start={paged.start}
        shown={paged.items.length}
        total={paged.total}
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
  const tableWidth = EDIT_W + columns.reduce((sum, c) => sum + columnWidth(c.col), 0);

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
          <col style={{ width: EDIT_W }} />
          {columns.map(({ col }) => (
            <col key={col} style={{ width: columnWidth(col) }} />
          ))}
        </colgroup>
        <thead className="bg-surface">
          <tr className="text-left">
            <th className="sticky left-0 z-[1] border-b border-border bg-surface">
              <span className="sr-only">{copy.fieldMap.actionsColumn}</span>
            </th>
            {columns.map(({ col, sheetIndex }, i) => (
              <th
                key={col}
                style={pinned(columns, i).style}
                className={cn(
                  "border-b border-border pb-2.5 pt-3 align-bottom font-medium",
                  HEAD_PAD,
                  pinned(columns, i).className,
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
    </div>
  );
}

function SheetRow({
  row,
  columns,
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
  name: string;
  editing: boolean;
  changed: boolean;
  onToggleEditing: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onCellChange: (col: string, value: string) => void;
}) {
  const t = copy.fieldMap;
  /* A reviewer reads every row; the actions are the expert's. */
  const readOnly = useReadOnly();
  /* The row open for editing is tinted, so it is plain which one the inputs
     belong to. */
  const background = editing ? "bg-brand-quiet" : "bg-surface";

  return (
    <tr className={background}>
      {/* Edit, Duplicate, Delete — the row's own actions, always in reach.
          While the row is open they give way to its one tick, so the only
          thing to do there is finish. Delete is the risk colour on hover only:
          at rest the three are equal and quiet. */}
      <td className={cn("sticky left-0 z-[1] border-b border-border py-1.5 pl-2", background)}>
        <span className={cn("relative flex items-center gap-0.5", readOnly && "invisible")}>
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
          {!editing && (
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
          {/* An unsaved change, marked on the row it lives in. */}
          {changed && !editing && (
            <span
              aria-label={t.unsavedRow}
              className="absolute left-[26px] top-0.5 size-1.5 rounded-full bg-brand"
            />
          )}
        </span>
      </td>
      {columns.map(({ col }, i) => {
        const value = row[col] ?? "";
        const isFlag = FLAGS.has(col) && (value === "TRUE" || value === "FALSE");
        /* A box's calculation is written only while it is calculated: the
           field opens with is_calculated ticked, and unticking clears it. */
        const locked = col === "calculation" && row.is_calculated !== "TRUE";
        return (
          <td
            key={col}
            style={pinned(columns, i, background).style}
            className={cn(
              "border-b border-border py-1.5 align-middle",
              CELL_PAD,
              pinned(columns, i, background).className,
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
                placeholder={editing && locked ? copy.fieldMap.calculationLocked : copy.fieldMap.empty}
                data-numeric={NUMERIC.has(col) ? "" : undefined}
                className={cn(CODE.has(col) && "font-mono text-[12px]")}
              />
            )}
          </td>
        );
      })}
    </tr>
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
