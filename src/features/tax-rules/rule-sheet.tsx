"use client";

import * as React from "react";
import { Check, Pencil } from "lucide-react";
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

/* The row number and the pen lead every row, at the width of their content. */
const LEADING = 2;

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
  rows,
  pinned = 2,
  rowName = 0,
  isEditing,
  isChanged,
  onToggleEditing,
  onCellChange,
}: {
  columns: readonly string[];
  rows: string[][];
  /** How many of the sheet's own columns stay pinned after the number and pen. */
  pinned?: number;
  /** Which column names a row, for the pen's label. */
  rowName?: number;
  isEditing: (row: number) => boolean;
  isChanged: (row: number) => boolean;
  onToggleEditing: (row: number) => void;
  onCellChange: (row: number, col: number, value: string) => void;
}) {
  const t = copy.taxRules;
  const headRef = React.useRef<HTMLTableRowElement>(null);
  /* Left offsets of the leading columns and each pinned sheet column. */
  const [left, setLeft] = React.useState<number[]>([]);
  const lastPinned = LEADING + pinned - 1;

  React.useLayoutEffect(() => {
    const cells = headRef.current?.children;
    if (!cells) return;
    const offsets: number[] = [];
    let x = 0;
    for (let i = 0; i <= lastPinned; i++) {
      offsets.push(x);
      x += (cells[i] as HTMLElement).offsetWidth;
    }
    setLeft(offsets);
  }, [columns, rows, lastPinned]);

  /* `i` counts the number as 0, the pen as 1, the sheet's first column as 2.
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
            {/* `w-px` keeps the number and pen at their content's width when
                the table stretches to fill the card. */}
            <th style={pin(0).style} className={cn(HEAD, "w-px pl-5 pr-2", pin(0).className)}>
              <span aria-hidden className="block text-[11px] leading-4">&nbsp;</span>
              <span className="block text-[12px] leading-4 text-text-muted">{t.numberColumn}</span>
            </th>
            <th style={pin(1).style} className={cn(HEAD, "w-px px-1", pin(1).className)}>
              <span className="sr-only">{t.editColumn}</span>
            </th>
            {columns.map((col, i) => (
              <th
                key={col + i}
                style={pin(i + LEADING).style}
                className={cn(HEAD, pin(i + LEADING).className)}
              >
                <span className="block text-[11px] leading-4 text-text-faint" data-numeric>
                  {columnLetter(i)}
                </span>
                <span className="block text-[12px] leading-4 text-text-muted">{col}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => {
            const editing = isEditing(r);
            const background = editing ? "bg-brand-quiet" : "bg-surface";
            const name = row[rowName] || String(r + 1);
            const label = fill(editing ? t.doneEditing : t.editRow, { name });
            return (
              <tr key={r} className={background}>
                <td
                  style={pin(0, background).style}
                  className={cn(CELL, "w-px pl-5 pr-2 text-text-faint", pin(0, background).className)}
                  data-numeric
                >
                  {r + 1}
                </td>
                <td
                  style={pin(1, background).style}
                  className={cn(CELL, "w-px px-1", pin(1, background).className)}
                >
                  <span className="relative flex">
                    <button
                      type="button"
                      onClick={() => onToggleEditing(r)}
                      aria-pressed={editing}
                      aria-label={label}
                      title={label}
                      className={cn(
                        "inline-flex size-8 items-center justify-center rounded-md transition-colors",
                        editing
                          ? "bg-brand text-on-brand hover:bg-brand-hover"
                          : "text-text-faint hover:bg-wash hover:text-text",
                      )}
                    >
                      {editing ? <Check className="size-4" /> : <Pencil className="size-3.5" />}
                    </button>
                    {/* An unsaved change, marked on the row it lives in. */}
                    {isChanged(r) && !editing && (
                      <span
                        aria-label={t.unsavedRow}
                        className="absolute right-0.5 top-0.5 size-1.5 rounded-full bg-brand"
                      />
                    )}
                  </span>
                </td>
                {columns.map((col, i) => {
                  const raw = row[i] ?? "";
                  const value = raw.replace(/\s*\n\s*/g, " ");
                  const numeric = NUMERIC.test(col) ? "" : undefined;
                  return (
                    <td
                      key={col + i}
                      style={pin(i + LEADING, background).style}
                      className={cn(
                        CELL,
                        value ? "text-text" : "text-text-faint",
                        pin(i + LEADING, background).className,
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
