"use client";

import * as React from "react";
import { Check, ChevronDown, Minus, Plus, Trash2, TriangleAlert } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/cn";
import type { Dataset, RuleColumn, RuleRow } from "@/lib/types";

/**
 * A quiet editable table.
 *
 * This step genuinely is tabular — rules are rows with consistent columns and
 * experts read down them — so it stays a table rather than being forced into
 * prose rows. The restraint goes into weight instead: hairline dividers rather
 * than cell borders, a single header rule, and codes in mono so they align
 * down the column.
 *
 * Editing happens in place. Click a cell, type, Enter or blur commits, Escape
 * cancels. No edit mode, no per-row save button, no asterisks on required
 * fields — the dev prototype had all three. A required column is marked once,
 * in its header, and only complains when the cell is actually empty.
 */
export function RuleTable({
  dataset,
  onEdit,
  onResolve,
  onDelete,
  onAdd,
}: {
  dataset: Dataset;
  onEdit: (rowId: string, key: string, value: string) => void;
  onResolve: (rowId: string) => void;
  onDelete: (rowId: string) => void;
  onAdd: () => void;
}) {
  /* Columns + Source + the actions column. */
  const span = dataset.columns.length + 2;
  return (
    <div className="-mx-2 overflow-x-auto px-2">
      <table className="w-full min-w-[64rem] border-collapse text-left">
        <thead>
          <tr className="border-b border-border align-bottom">
            {dataset.columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={cn(
                  "pb-2.5 pr-4 text-[12px] font-medium uppercase tracking-[0.08em] text-text-faint",
                  col.width,
                )}
              >
                {col.label}
              </th>
            ))}
            <th
              scope="col"
              className="w-32 pb-2.5 pr-4 text-[12px] font-medium uppercase tracking-[0.08em] text-text-faint"
            >
              Source
            </th>
            <th scope="col" className="w-10 pb-2.5">
              <span className="sr-only">Row actions</span>
            </th>
          </tr>
        </thead>

        <tbody>
          {dataset.rows.map((r, i) => (
            <Row
              key={r.id}
              row={r}
              index={i}
              dataset={dataset}
              onEdit={(key, value) => onEdit(r.id, key, value)}
              onResolve={() => onResolve(r.id)}
              onDelete={() => onDelete(r.id)}
            />
          ))}

          {/* Adding a row is part of the table, not a control floating above it:
              the last line is itself the way to extend the list. */}
          <tr>
            <td colSpan={span} className="pt-1">
              <button
                type="button"
                onClick={onAdd}
                className="flex w-full items-center gap-2 rounded-md px-2 py-2.5 text-left text-[13px] font-medium text-text-muted transition-colors hover:bg-wash hover:text-text"
              >
                <Plus className="size-4 text-text-faint" strokeWidth={2} />
                Add a rule row
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function Row({
  row,
  index,
  dataset,
  onEdit,
  onResolve,
  onDelete,
}: {
  row: RuleRow;
  index: number;
  dataset: Dataset;
  onEdit: (key: string, value: string) => void;
  onResolve: () => void;
  onDelete: () => void;
}) {
  const span = dataset.columns.length + 2;

  return (
    <>
      <tr
        data-review-item={row.issue ? "" : undefined}
        className={cn(
          "rise group align-top",
          /* An issue row keeps the same surface as every other row — the amber
             lives only in the concern box below it — so it just drops its own
             bottom rule to sit flush with that box. */
          row.issue ? "" : "border-b border-border last:border-0",
        )}
        style={{ "--index": Math.min(index, 8) } as React.CSSProperties}
      >
        {dataset.columns.map((col) => (
          <td key={col.key} className="py-1 pr-4">
            <CellControl
              column={col}
              row={row}
              onCommit={(v) => onEdit(col.key, v)}
            />
          </td>
        ))}

        <td className="py-1 pr-4">
          {row.citation ? (
            <a
              href={row.citation.url}
              target="_blank"
              rel="noopener noreferrer"
              title={row.citation.locator}
              className="mt-2 inline-flex max-w-full items-center rounded-md border border-border bg-surface-sunken px-1.5 py-0.5 text-[12px] text-text-muted transition-colors hover:border-border-strong hover:text-text"
            >
              <span className="truncate">{row.citation.label}</span>
            </a>
          ) : (
            <span className="mt-2 inline-flex items-center gap-1 py-0.5 text-[12px] text-text-faint">
              <Minus className="size-3" />
              {row.addedByHand ? "Added by hand" : "No citation"}
            </span>
          )}
        </td>

        <td className="py-1">
          <button
            type="button"
            onClick={onDelete}
            aria-label="Delete row"
            className="mt-1 grid size-7 place-items-center rounded-md text-text-faint transition-colors hover:bg-risk-quiet hover:text-risk focus-visible:bg-risk-quiet focus-visible:text-risk"
          >
            <Trash2 className="size-3.5" />
          </button>
        </td>
      </tr>

      {row.issue && (
        <tr className="border-b border-border last:border-0">
          {/* px-2 lines the box up with the cell contents above it. */}
          <td colSpan={span} className="px-2 pb-3.5 pt-1">
            {/* The concern reads in a filled amber box — the same treatment step
                two gives a finding that needs review, so a flag reads the same
                way across the flow. */}
            <div className="max-w-[80ch] rounded-lg border border-attention-edge bg-attention-quiet px-3.5 py-2.5">
              <p className="flex items-start gap-2 text-[13px] leading-relaxed text-attention-text">
                <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
                <span>{row.issue}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={onResolve}
              className="mt-2.5 inline-flex items-center gap-1.5 rounded-md border border-attention-edge bg-surface px-2.5 py-1 text-[13px] font-medium text-attention-text transition-colors hover:bg-attention-quiet active:scale-[0.98]"
            >
              <Check className="size-3.5" />
              Settled — carry this row forward
            </button>
          </td>
        </tr>
      )}
    </>
  );
}

function CellControl({
  column,
  row,
  onCommit,
}: {
  column: RuleColumn;
  row: RuleRow;
  onCommit: (value: string) => void;
}) {
  const cell = row.cells[column.key];
  const value = cell?.value ?? "";
  const missing = Boolean(column.required) && !value.trim();
  const label = `${column.label} for ${row.cells[Object.keys(row.cells)[0]]?.value || "new row"}`;

  if (!column.editable) {
    return (
      <span
        className={cn(
          "block py-2 text-[14px] text-text",
          column.mono && "font-mono tabular-nums",
        )}
      >
        {value || "—"}
      </span>
    );
  }

  if (column.kind === "flag") {
    return (
      <span className="flex items-center py-2.5 pl-2">
        <Checkbox
          checked={value === "yes"}
          aria-label={label}
          onCheckedChange={(next) => onCommit(next ? "yes" : "no")}
        />
      </span>
    );
  }

  if (column.kind === "select") {
    return (
      <span className="relative block">
        <select
          value={value}
          aria-label={label}
          onChange={(e) => onCommit(e.target.value)}
          className={cn(
            "w-full appearance-none rounded-md border border-border-strong bg-surface py-2 pl-2 pr-6 text-[14px] text-text",
            "transition-colors hover:border-brand/50 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20",
            column.mono && "font-mono tabular-nums",
            missing && "border-risk-edge bg-risk-quiet text-risk",
          )}
        >
          <option value="">{column.required ? "Choose…" : "—"}</option>
          {(column.options ?? []).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-text-faint"
        />
      </span>
    );
  }

  return (
    <EditableCell
      value={value}
      original={cell?.original}
      mono={column.mono}
      date={column.kind === "date"}
      missing={missing}
      label={label}
      onCommit={onCommit}
    />
  );
}

/**
 * Looks like text until you click it. The input keeps the same metrics as the
 * static value so committing an edit doesn't shift the row.
 */
function EditableCell({
  value,
  original,
  mono,
  date,
  missing,
  label,
  onCommit,
}: {
  value: string;
  original?: string;
  mono?: boolean;
  date?: boolean;
  missing?: boolean;
  label: string;
  onCommit: (value: string) => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(value);

  function commit() {
    setEditing(false);
    const next = draft.trim();
    if (next !== value) onCommit(next);
    else setDraft(value);
  }

  if (editing) {
    return (
      <input
        autoFocus
        type={date ? "date" : "text"}
        aria-label={label}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
        onFocus={(e) => e.target.select()}
        className={cn(
          "w-full rounded-md border border-brand bg-surface px-2 py-2 text-[14px] text-text",
          "focus:outline-none focus:ring-2 focus:ring-brand/20",
          mono && "font-mono tabular-nums",
        )}
      />
    );
  }

  return (
    <button
      type="button"
      aria-label={`${label}: ${value || "empty"}. Click to edit.`}
      onClick={() => {
        setDraft(value);
        setEditing(true);
      }}
      className={cn(
        "flex w-full items-center gap-1.5 rounded-md border border-border-strong bg-surface px-2 py-2 text-left text-[14px] text-text",
        "transition-colors hover:border-brand/50 focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/20",
        mono && "font-mono tabular-nums",
        missing && "border-risk-edge bg-risk-quiet text-risk",
      )}
    >
      <span className={cn("truncate", !value && !missing && "text-text-faint")}>
        {value || (missing ? "Needed" : "—")}
      </span>
      {original && (
        <span
          aria-hidden
          title={`Agent proposed ${original}`}
          className="size-1.5 shrink-0 rounded-full bg-brand"
        />
      )}
    </button>
  );
}
