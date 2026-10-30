"use client";

import * as React from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useReadOnly } from "@/components/patterns/read-only";
import { CodeBlock } from "@/components/ui/code-block";
import { Textarea } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { copy, fill } from "@/lib/copy";
import type { BoxQuery } from "@/lib/mock/query-builder";
import type { QueryBuilder, QueryState } from "./use-query-builder";

/* Code reads in the system's own monospace (SF Mono on a Mac) — plainer than
   the brand mono, and it keeps a query's indentation lined up. */
const CODE_FONT = "font-[ui-monospace,SFMono-Regular,Menlo,monospace]";

/* Every cell starts on the same first line: a 20px line at the top of the
   cell. Text uses leading-5; anything taller than a line (the empty query
   slot, the edit button) is pulled up by half its excess so it centres on it. */
const CELL = "border-b border-border px-4 py-4 align-top";
const HEAD = "border-b border-border px-4 py-2.5 text-left text-[12px] font-medium text-text-muted";

/**
 * The query builder as one table: a row per annotated box, read across from
 * the box, to the rule that fills it, to the SQL that computes it. The SQL
 * column starts empty and fills as rows are generated; the pencil at the end
 * of a row opens its query for writing by hand.
 */
export function QueryTable({
  q,
  boxes = q.boxes,
  selected,
  onSelectedChange,
  onSelectAll,
}: {
  q: QueryBuilder;
  /** The rows to show — the filtered page; every box by default. */
  boxes?: BoxQuery[];
  selected: ReadonlySet<string>;
  onSelectedChange: (id: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
}) {
  const t = copy.queryBuilder;
  const [editing, setEditing] = React.useState<string | null>(null);
  /* A reviewer reads the queries; ticking and editing are the expert's. */
  const readOnly = useReadOnly();
  const count = q.boxes.filter((b) => selected.has(b.id)).length;
  const all = count === q.boxes.length;

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-raised)]">
      <div className="overflow-x-auto [scrollbar-width:thin]">
        <table className="w-full min-w-[1000px] table-fixed border-separate border-spacing-0 text-sm">
          <colgroup>
            {!readOnly && <col className="w-11" />}
            <col className="w-[17%]" />
            <col className="w-[28%]" />
            <col />
            {!readOnly && <col className="w-16" />}
          </colgroup>
          <thead>
            <tr className="bg-surface-sunken">
              {!readOnly && (
                <th className={cn(HEAD, "pr-0")}>
                  <Checkbox
                    checked={all ? true : count > 0 ? "indeterminate" : false}
                    onCheckedChange={() => onSelectAll(!all)}
                    aria-label={all ? t.deselectAll : t.selectAll}
                    className="mt-px"
                  />
                </th>
              )}
              <th className={HEAD}>{t.columns.box}</th>
              <th className={HEAD}>{t.columns.rule}</th>
              <th className={HEAD}>{t.columns.sql}</th>
              {!readOnly && <th className={cn(HEAD, "text-center")}>{t.columns.edit}</th>}
            </tr>
          </thead>
          <tbody>
            {boxes.map((box, i) => (
              <QueryRow
                key={box.id}
                box={box}
                query={q.queries[box.id]}
                last={i === boxes.length - 1}
                selected={selected.has(box.id)}
                onSelectedChange={(on) => onSelectedChange(box.id, on)}
                editing={editing === box.id}
                editLocked={editing !== null && editing !== box.id}
                onEdit={() => setEditing(box.id)}
                onCloseEdit={() => setEditing(null)}
                onSave={(sql) => {
                  q.save(box.id, sql);
                  setEditing(null);
                }}
                onDescribe={(note) => q.describe(box.id, note)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function QueryRow({
  box,
  query,
  last,
  selected,
  onSelectedChange,
  editing,
  editLocked,
  onEdit,
  onCloseEdit,
  onSave,
  onDescribe,
}: {
  box: BoxQuery;
  query: QueryState;
  last: boolean;
  selected: boolean;
  onSelectedChange: (selected: boolean) => void;
  editing: boolean;
  editLocked: boolean;
  onEdit: () => void;
  onCloseEdit: () => void;
  onSave: (sql: string) => void;
  onDescribe: (note: string) => void;
}) {
  const t = copy.queryBuilder;
  const busy = query.status === "generating";
  const readOnly = useReadOnly();
  const cell = cn(CELL, last && "border-b-0");

  return (
    <tr className={cn("transition-colors", editing && "bg-brand-quiet/50")}>
      {!readOnly && (
        <td className={cn(cell, "pr-0")}>
          <Checkbox
            checked={selected}
            disabled={busy}
            onCheckedChange={(v) => onSelectedChange(v === true)}
            aria-label={fill(t.selectBox, { box: box.box })}
            className="mt-px"
          />
        </td>
      )}

      <td className={cell}>
        <p className="text-[14px] font-medium leading-5 text-heading">{box.box}</p>
        <p
          title={box.description}
          className="mt-1 line-clamp-2 text-[13px] leading-5 text-text-muted"
        >
          {box.description}
        </p>
      </td>

      <td className={cell}>
        <RuleCell box={box} />
      </td>

      <td className={cell}>
        {editing ? (
          <QueryEditor
            box={box.box}
            initial={query.sql}
            onSave={onSave}
            onCancel={onCloseEdit}
          />
        ) : (
          <SqlCell
            box={box.box}
            query={query}
            calculated={Boolean(box.calculation)}
            onDescribe={onDescribe}
          />
        )}
      </td>

      {!readOnly && (
        <td className={cn(cell, "text-center")}>
          <button
            type="button"
            onClick={onEdit}
            disabled={busy || editLocked}
            aria-label={fill(t.editQuery, { box: box.box })}
            title={fill(t.editQuery, { box: box.box })}
            className={cn(
              "-my-1.5 inline-flex size-8 items-center justify-center rounded-md transition-colors",
              editing
                ? "bg-brand text-on-brand"
                : "text-text-faint hover:bg-wash hover:text-text disabled:pointer-events-none disabled:opacity-40",
            )}
          >
            <Pencil className="size-3.5" />
          </button>
        </td>
      )}
    </tr>
  );
}

/** What fills the box: its calculation, word for word as the field map holds
 *  it — or NULL, for a calculated box whose calculation is not written yet. */
function RuleCell({ box }: { box: BoxQuery }) {
  const t = copy.queryBuilder;

  if (!box.calculation) {
    return <p className="font-mono text-[13px] leading-5 text-text-faint">{t.nullRule}</p>;
  }

  return (
    <div>
      <p className="text-[13px] leading-5 text-text-muted">{t.calculated}</p>
      {/* Wrapped, not scrolled sideways: the rule column is narrow and is
          read, not copied. */}
      <CodeBlock
        code={box.calculation}
        className="mt-2 max-h-60 overflow-y-auto [&_table]:font-[ui-monospace,SFMono-Regular,Menlo,monospace] [&_td+td]:whitespace-pre-wrap [&_td+td]:[overflow-wrap:anywhere]"
      />
    </div>
  );
}

function SqlCell({
  box,
  query,
  calculated,
  onDescribe,
}: {
  box: string;
  query: QueryState;
  /** The box's calculation in the field map is its query already. */
  calculated: boolean;
  onDescribe: (note: string) => void;
}) {
  const t = copy.queryBuilder;
  const readOnly = useReadOnly();

  if (query.status === "generating") {
    return (
      <div
        aria-busy
        className="-mt-px overflow-hidden rounded-lg border border-border bg-surface-sunken px-3 py-2.5"
      >
        <span className="sr-only">{fill(t.generating, { box })}</span>
        {["w-[46%]", "w-[72%]", "w-[58%]", "w-[88%]", "w-[34%]"].map((w, i) => (
          <span
            key={w}
            aria-hidden
            style={{ animationDelay: `${i * 120}ms` }}
            className={cn("my-[7px] block h-1.5 animate-pulse rounded-full bg-border", w)}
          />
        ))}
      </div>
    );
  }

  /* No query, so the box must say in plain English what it calculates —
     the step cannot be sent on while one says nothing. */
  if (!query.sql.trim()) {
    if (calculated) {
      return (
        <div className="-my-2.5 flex h-10 items-center rounded-lg border border-dashed border-border-strong px-3 text-[13px] text-text-faint">
          {t.notGenerated}
        </div>
      );
    }
    if (readOnly) {
      return query.note.trim() ? (
        <div>
          <p className="text-[12px] leading-5 text-text-muted">{t.noteLabel}</p>
          <p className="mt-1 whitespace-pre-wrap text-[13px] leading-5 text-text">{query.note}</p>
        </div>
      ) : (
        <div className="-my-2.5 flex h-10 items-center rounded-lg border border-dashed border-border-strong px-3 text-[13px] text-text-faint">
          {t.notGenerated}
        </div>
      );
    }
    const missing = !query.note.trim();
    return (
      <div className="-mt-0.5">
        <label className="block">
          <span className="text-[12px] leading-5 text-text-muted">{t.noteLabel}</span>
          <Textarea
            rows={2}
            value={query.note}
            onChange={(e) => onDescribe(e.target.value)}
            placeholder={t.notePlaceholder}
            aria-label={fill(t.noteAria, { box })}
            aria-invalid={missing ? true : undefined}
            className={cn("mt-1 text-[13px] leading-5", missing && "border-attention-edge")}
          />
        </label>
        {missing && (
          <p className="mt-1 text-[12px] leading-5 text-attention-text">{t.noteRequired}</p>
        )}
      </div>
    );
  }

  return (
    <div className="rise -mt-0.5">
      <CodeBlock code={query.sql} className="max-h-60 overflow-y-auto [&_table]:font-[ui-monospace,SFMono-Regular,Menlo,monospace]" />
      {query.status === "edited" && (
        <p className="mt-1.5 text-[12px] text-text-muted">{t.edited}</p>
      )}
    </div>
  );
}

function QueryEditor({
  box,
  initial,
  onSave,
  onCancel,
}: {
  box: string;
  initial: string;
  onSave: (sql: string) => void;
  onCancel: () => void;
}) {
  const t = copy.queryBuilder;
  const [draft, setDraft] = React.useState(initial);
  const rows = Math.min(16, Math.max(6, draft.split("\n").length + 1));

  return (
    <div>
      <Textarea
        autoFocus
        value={draft}
        rows={rows}
        spellCheck={false}
        aria-label={fill(t.sqlLabel, { box })}
        placeholder={t.sqlPlaceholder}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            onCancel();
          }
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            onSave(draft);
          }
        }}
        className={cn("-mt-px whitespace-pre bg-surface text-[12px] leading-[1.7]", CODE_FONT)}
      />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button size="sm" variant="primary" onClick={() => onSave(draft)}>
          {t.save}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          {t.cancel}
        </Button>
        <span className="ml-auto text-[12px] text-text-faint">{t.saveHint}</span>
      </div>
    </div>
  );
}
