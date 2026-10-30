"use client";

import * as React from "react";
import { Check, Copy, Pencil, Trash2, X } from "lucide-react";
import { useReadOnly } from "@/components/patterns/read-only";
import { cn } from "@/lib/cn";
import { copy, fill } from "@/lib/copy";

/** The sheet's column letters, so a cell can be traced back to the workbook. */
export function columnLetter(index: number): string {
  let n = index + 1;
  let out = "";
  while (n > 0) {
    const r = (n - 1) % 26;
    out = String.fromCharCode(65 + r) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

/* Box references and rate codes keep tabular figures so they sit in step. */
const NUMERIC = /return box|^Rate$|^Code$|Hungary|date/i;

/* Generous gutters between columns, and the table always spans the card: a
   short sheet like Rates spreads across the width rather than huddling left. */
const HEAD = "border-b border-border px-6 pb-2.5 pt-3 text-left align-bottom font-medium";
const CELL = "h-12 border-b border-border px-6 align-middle";

/* A row action: the pen, duplicate and delete share one square. */
const ACTION = "inline-flex size-8 shrink-0 items-center justify-center rounded-md transition-colors";

/* The first column sits on the card's 16px inset, level with the line of
   text above the table. */
const FIRST = "pl-4";

/**
 * One generated sheet, as the workbook holds it: a row number and its pen,
 * then the sheet's own headers under its column letters.
 *
 * Every row is editable, one at a time: the pen opens it — the row tints and
 * its cells become fields — and a tick closes it. Edits are held as a draft
 * until Save changes; a closed row with unsaved edits carries a dot.
 *
 * Columns size to their content, so headers and values never clip; only a
 * long comment is capped, with the full text on hover. The number, the pen and
 * the leading columns stay pinned while the rest scroll sideways — their
 * offsets are read from the laid-out table, since content decides the widths.
 */
export function RuleSheet({
  columns,
  entries,
  pinned = 2,
  nameOf,
  isEditing,
  isChanged,
  onToggleEditing,
  onDuplicate,
  onDelete,
  onCellChange,
  addedColumn,
  onDeleteColumn,
}: {
  columns: readonly string[];
  /** For a column the expert added, what it holds — shown under its name;
      undefined for the sheet's own columns. */
  addedColumn?: (name: string) => { typeLabel?: string } | undefined;
  /** Takes out a column the expert added; absent once it can no longer go. */
  onDeleteColumn?: (name: string) => void;
  /** The rows to show, each with its index in the full sheet — what the
      number, and every edit, refer to. */
  entries: { row: string[]; index: number }[];
  /** How many of the sheet's own columns stay pinned after the number and pen. */
  pinned?: number;
  /** What a row is called, for its actions' labels. */
  nameOf: (row: string[]) => string;
  isEditing: (row: number) => boolean;
  isChanged: (row: number) => boolean;
  onToggleEditing: (row: number) => void;
  onDuplicate: (row: number) => void;
  onDelete: (row: number) => void;
  onCellChange: (row: number, col: number, value: string) => void;
}) {
  const t = copy.taxRules;
  /* A reviewer reads every rule; the row actions are the expert's. */
  const readOnly = useReadOnly();
  /* The row's actions lead every row, at the width of their content. Read
     only, there are none, so the column is left out rather than kept empty. */
  const leading = readOnly ? 0 : 1;
  const headRef = React.useRef<HTMLTableRowElement>(null);
  /* Left offsets of the leading columns and each pinned sheet column. */
  const [left, setLeft] = React.useState<number[]>([]);
  const lastPinned = leading + pinned - 1;

  React.useLayoutEffect(() => {
    const cells = headRef.current?.children;
    if (!cells) return;
    const offsets: number[] = [];
    let x = 0;
    for (let i = 0; i <= lastPinned; i++) {
      offsets.push(x);
      x += (cells[i] as HTMLElement).offsetWidth;
    }
    /* Entries are a fresh array each render, so only a real change in the
       offsets sets state — otherwise this would re-render without end. */
    setLeft((prev) =>
      prev.length === offsets.length && prev.every((x, i) => x === offsets[i]) ? prev : offsets,
    );
  }, [columns, entries, lastPinned]);

  /* `i` counts the actions as 0 and the sheet's first column as 1 — or, read
     only, the first column as 0.
     Pinned cells carry their row's background, so an open row stays tinted. */
  const pin = (i: number, background = "bg-surface") =>
    i <= lastPinned
      ? {
          className: cn(
            "sticky z-[1]",
            background,
            i === lastPinned && "shadow-[inset_-1px_0_0_var(--border-strong)]",
          ),
          style: { left: left[i] ?? 0 } as React.CSSProperties,
        }
      : { className: undefined, style: undefined };

  return (
    <div className="overflow-x-auto [scrollbar-width:thin]">
      <table className="w-max min-w-full border-separate border-spacing-0 whitespace-nowrap text-[13px]">
        <thead className="bg-surface">
          <tr ref={headRef}>
            {/* `w-px` keeps the actions at their content's width when the
                table stretches to fill the card. */}
            {leading > 0 && (
              <th style={pin(0).style} className={cn(HEAD, "w-px pl-4 pr-1", pin(0).className)}>
                <span className="sr-only">{t.editColumn}</span>
              </th>
            )}
            {columns.map((col, i) => (
              <th
                key={col + i}
                style={pin(i + leading).style}
                className={cn(HEAD, i === 0 && leading === 0 && FIRST, pin(i + leading).className)}
              >
                <span className="block text-[11px] leading-4 text-text-faint" data-numeric>
                  {columnLetter(i)}
                </span>
                {(() => {
                  const added = addedColumn?.(col);
                  return (
                    <span className="flex items-end gap-1.5">
                      <span>
                        <span className="block text-[12px] leading-4 text-text-muted">{col}</span>
                        {added?.typeLabel && (
                          <span className="block text-[11px] leading-4 text-text-faint">
                            {added.typeLabel}
                          </span>
                        )}
                      </span>
                      {/* Only a column the expert added can be taken out, and
                          only until the country is published. */}
                      {added && onDeleteColumn && !readOnly && (
                        <button
                          type="button"
                          onClick={() => onDeleteColumn(col)}
                          aria-label={fill(t.deleteColumn, { name: col })}
                          title={fill(t.deleteColumn, { name: col })}
                          className="-mb-0.5 grid size-5 place-items-center rounded text-text-faint transition-colors hover:bg-risk-quiet hover:text-risk"
                        >
                          <X className="size-3.5" />
                        </button>
                      )}
                    </span>
                  );
                })()}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {entries.map(({ row, index: r }) => {
            const editing = isEditing(r);
            const background = editing ? "bg-brand-quiet" : "bg-surface";
            const name = nameOf(row);
            const label = fill(editing ? t.doneEditing : t.editRow, { name });
            return (
              <tr key={r} className={background}>
                {leading > 0 && (
                  <td
                    style={pin(0, background).style}
                    className={cn(CELL, "w-px pl-4 pr-1", pin(0, background).className)}
                  >
                    {/* Edit, Duplicate, Delete — as on the spec sheets. While the
                        row is open they give way to its one tick, so the only
                        thing to do there is finish. Delete takes the risk colour
                        on hover only: at rest the three are equal and quiet. The
                        tick holds the same width, so the columns never shift. */}
                    <span className="relative flex w-[104px] items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => onToggleEditing(r)}
                        aria-pressed={editing}
                        aria-label={label}
                        title={label}
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
                            onClick={() => onDuplicate(r)}
                            aria-label={fill(t.duplicateRow, { name })}
                            title={fill(t.duplicateRow, { name })}
                            className={cn(ACTION, "text-text-faint hover:bg-wash hover:text-text")}
                          >
                            <Copy className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(r)}
                            aria-label={fill(t.deleteRow, { name })}
                            title={fill(t.deleteRow, { name })}
                            className={cn(ACTION, "text-text-faint hover:bg-risk-quiet hover:text-risk")}
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </>
                      )}
                      {/* An unsaved change, marked on the row it lives in. */}
                      {isChanged(r) && !editing && (
                        <span
                          aria-label={t.unsavedRow}
                          className="absolute left-[26px] top-0.5 size-1.5 rounded-full bg-brand"
                        />
                      )}
                    </span>
                  </td>
                )}
                {columns.map((col, i) => {
                  const raw = row[i] ?? "";
                  const value = raw.replace(/\s*\n\s*/g, " ");
                  const numeric = NUMERIC.test(col) ? "" : undefined;
                  return (
                    <td
                      key={col + i}
                      style={pin(i + leading, background).style}
                      className={cn(
                        CELL,
                        i === 0 && leading === 0 && FIRST,
                        value ? "text-text" : "text-text-faint",
                        pin(i + leading, background).className,
                      )}
                      data-numeric={numeric}
                    >
                      {editing ? (
                        /* The field grows with its text and sits on the same
                           edge as the read-only value, so opening a row does
                           not shift its columns. */
                        <input
                          type="text"
                          value={raw}
                          onChange={(e) => onCellChange(r, i, e.target.value)}
                          aria-label={`${col} ${name}`}
                          placeholder={t.empty}
                          data-numeric={numeric}
                          className="-mx-2 h-8 min-w-12 max-w-[360px] rounded-md border border-brand-edge bg-surface px-2 text-[13px] text-text [field-sizing:content] placeholder:text-text-faint focus:border-brand focus:outline-none"
                        />
                      ) : (
                        <span className="block max-w-[360px] truncate" title={value || undefined}>
                          {value || t.empty}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
