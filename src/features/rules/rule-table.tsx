"use client";

import * as React from "react";
import { TriangleAlert } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Dataset, RuleRow } from "@/lib/types";

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
 * fields — the dev prototype had all three.
 */
export function RuleTable({
  dataset,
  onEdit,
  onResolve,
}: {
  dataset: Dataset;
  onEdit: (rowId: string, key: string, value: string) => void;
  onResolve: (rowId: string) => void;
}) {
  return (
    <div className="-mx-2 overflow-x-auto px-2">
      <table className="w-full min-w-[40rem] border-collapse text-left">
        <thead>
          <tr className="border-b border-border">
            {dataset.columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={cn(
                  "pb-2.5 pr-6 text-[11px] font-medium uppercase tracking-[0.08em] text-text-faint last:pr-0",
                  col.width,
                )}
              >
                {col.label}
              </th>
            ))}
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
            />
          ))}
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
}: {
  row: RuleRow;
  index: number;
  dataset: Dataset;
  onEdit: (key: string, value: string) => void;
  onResolve: () => void;
}) {
  return (
    <>
      <tr
        className={cn(
          "rise group border-b border-border align-top last:border-0",
          row.issue && "bg-attention-quiet/40",
        )}
        style={{ "--index": index } as React.CSSProperties}
      >
        {dataset.columns.map((col) => {
          const cell = row.cells[col.key];
          if (!cell) return <td key={col.key} />;

          return (
            <td key={col.key} className="py-1 pr-6 last:pr-0">
              {col.editable ? (
                <EditableCell
                  value={cell.value}
                  original={cell.original}
                  mono={col.mono}
                  label={`${col.label} for ${row.cells[dataset.columns[0].key]?.value ?? "row"}`}
                  onCommit={(v) => onEdit(col.key, v)}
                />
              ) : (
                <span
                  className={cn(
                    "block py-2 text-[14px] text-text",
                    col.mono && "font-mono tabular-nums",
                  )}
                >
                  {cell.value}
                </span>
              )}
            </td>
          );
        })}
      </tr>

      {row.issue && (
        <tr className="border-b border-border bg-attention-quiet/40 last:border-0">
          <td colSpan={dataset.columns.length} className="pb-3 pr-6">
            <p className="flex max-w-[70ch] items-start gap-2 text-[13px] leading-relaxed text-attention-text">
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
              {row.issue}
            </p>
            <button
              type="button"
              onClick={onResolve}
              className="ml-5.5 mt-2 text-[13px] font-medium text-attention-text underline-offset-4 transition-colors hover:text-text hover:underline"
            >
              Mapping is correct as shown
            </button>
          </td>
        </tr>
      )}
    </>
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
  label,
  onCommit,
}: {
  value: string;
  original?: string;
  mono?: boolean;
  label: string;
  onCommit: (value: string) => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(value);

  function commit() {
    setEditing(false);
    const next = draft.trim();
    if (next && next !== value) onCommit(next);
    else setDraft(value);
  }

  if (editing) {
    return (
      <input
        autoFocus
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
      aria-label={`${label}: ${value}. Click to edit.`}
      onClick={() => {
        setDraft(value);
        setEditing(true);
      }}
      className={cn(
        "flex w-full items-center gap-1.5 rounded-md px-2 py-2 text-left text-[14px] text-text",
        "border border-transparent transition-colors hover:border-border-strong hover:bg-surface",
        mono && "font-mono tabular-nums",
      )}
    >
      <span className="truncate">{value}</span>
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
