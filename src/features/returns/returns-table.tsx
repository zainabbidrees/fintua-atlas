"use client";

import * as React from "react";
import {
  ArrowUpRight,
  Check,
  Link2,
  Loader2,
  Paperclip,
  Pencil,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useReadOnly } from "@/components/patterns/read-only";
import { Input, Textarea } from "@/components/ui/input";
import { AttentionNote } from "@/components/ui/attention-note";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { AddFileOrLink } from "@/components/patterns/add-file-or-link";
import {
  extensionOf,
  hostOf,
  SourceMark,
} from "@/components/domain/source-block";
import { copy, fill } from "@/lib/copy";
import { cn } from "@/lib/cn";
import { deadlineDays, nextDeadline } from "@/lib/deadline";
import { formatDate } from "@/components/domain/filing-card";
import type { Evidence, Finding, FindingRole, ObligationRun } from "@/lib/types";
import type { useReturns } from "./use-returns";

/** PDF, XML, XSD, CSV, XLS, XLSX or TXT — the material a specialist holds. */
const ACCEPT = ".pdf,.xml,.xsd,.csv,.xls,.xlsx,.txt";

/* Every cell starts on the same first line: a 20px line at the top of the
   cell. Text uses leading-5; anything taller than a line (a button, a source
   tile) is pulled up by half its excess so it centres on that line. */
const CELL = "px-4 py-4 align-top";

type RowState = "running" | "needs_review" | "cross_checked" | "confirmed";

function rowStateOf(o: ObligationRun): RowState {
  if (o.agent === "running") return "running";
  if (o.findings.some((f) => f.state === "needs_review")) return "needs_review";
  if (
    o.findings.length > 0 &&
    o.findings.every((f) => f.state === "confirmed" || f.state === "edited")
  ) {
    return "confirmed";
  }
  return "cross_checked";
}

const valueOf = (o: ObligationRun, role: FindingRole) =>
  o.findings.find((f) => f.role === role) ?? null;

/** What the agent was unsure about — the first flagged value's concern. */
const concernOf = (o: ObligationRun) =>
  o.findings.find((f) => f.state === "needs_review" && f.concern)?.concern ??
  null;

/** The distinct documents behind this return type's values, in first-seen order. */
function sourcesOf(o: ObligationRun): Evidence[] {
  const seen = new Set<string>();
  const out: Evidence[] = [];
  for (const f of o.findings) {
    if (seen.has(f.evidence.url)) continue;
    seen.add(f.evidence.url);
    out.push(f.evidence);
  }
  return out;
}

/**
 * Step 2 as one table: a row per return type, read down columns of like things
 * — how often it is filed, by when, the sources behind those answers, and the
 * expert's own attachments. A return type whose evidence is thin reads as a
 * flagged box with its concern spelled out beneath, and is cleared with one
 * Confirm; the same grammar as step one's filing table.
 */
export function ReturnsTable({
  r,
  rows = r.obligations,
  selected,
  onSelectedChange,
  onOpenSource,
}: {
  r: ReturnType<typeof useReturns>;
  /** The rows to show — the filtered page; every return type by default. */
  rows?: ObligationRun[];
  selected: ReadonlySet<string>;
  onSelectedChange: (id: string, selected: boolean) => void;
  onOpenSource: (evidence: Evidence) => void;
}) {
  const head = "px-4 py-2.5 text-left text-[12px] font-medium text-text-muted";

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-raised)]">
      <div className="relative overflow-x-auto [scrollbar-width:thin]">
        <table className="w-full min-w-[1040px] table-fixed border-separate border-spacing-0 text-sm">
          {/* The four content columns share the width left after the fixed
              ones (checkbox, Attachments, Status — 320px), in the ratio
              19 : 24 : 31 : 26. A column's width can't be a calc() of the
              table, so the shares step up at wider screens to keep filling
              it; between steps, at most ~45px is left over at the far right. */}
          <colgroup>
            <col className="w-11" />
            <col className="w-[13.1%] min-[1536px]:w-[13.7%] min-[1700px]:w-[14.4%] min-[1850px]:w-[14.9%] min-[1984px]:w-[15.2%]" />
            <col className="w-[16.6%] min-[1536px]:w-[17.3%] min-[1700px]:w-[18.2%] min-[1850px]:w-[18.8%] min-[1984px]:w-[19.2%]" />
            <col className="w-[21.4%] min-[1536px]:w-[22.4%] min-[1700px]:w-[23.5%] min-[1850px]:w-[24.2%] min-[1984px]:w-[24.8%]" />
            <col className="w-[17.9%] min-[1536px]:w-[18.8%] min-[1700px]:w-[19.7%] min-[1850px]:w-[20.3%] min-[1984px]:w-[20.8%]" />
            <col className="w-[124px]" />
            <col />
          </colgroup>
          <thead>
            <tr className="bg-surface-sunken">
              <th className={cn(head, "pr-0")}>
                <span className="sr-only">{copy.filings.selectAll}</span>
              </th>
              <th className={head}>{copy.returnsTable.columns.returnType}</th>
              <th className={head}>{copy.returnsTable.columns.frequency}</th>
              <th className={head}>{copy.returnsTable.columns.deadline}</th>
              <th className={head}>{copy.returnsTable.columns.sources}</th>
              <th className={head}>{copy.returnsTable.columns.attach}</th>
              <th className={head}>{copy.returnsTable.columns.status}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o, i) => (
              <ReturnRow
                key={o.id}
                o={o}
                last={i === rows.length - 1}
                nextFlagged={
                  rowStateOf(rows[i + 1] ?? o) === "needs_review" &&
                  i + 1 < rows.length
                }
                r={r}
                selected={selected.has(o.id)}
                onSelectedChange={onSelectedChange}
                onOpenSource={onOpenSource}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReturnRow({
  o,
  last,
  nextFlagged,
  r,
  selected,
  onSelectedChange,
  onOpenSource,
}: {
  o: ObligationRun;
  last: boolean;
  nextFlagged: boolean;
  r: ReturnType<typeof useReturns>;
  selected: boolean;
  onSelectedChange: (id: string, selected: boolean) => void;
  onOpenSource: (evidence: Evidence) => void;
}) {
  const state = rowStateOf(o);
  const flagged = state === "needs_review";
  const concern = flagged ? concernOf(o) : null;
  const showNote = Boolean(concern);
  const frequency = valueOf(o, "frequency");
  const deadline = valueOf(o, "deadline");
  const sources = sourcesOf(o);

  /* Plain rows are parted by a grey divider. A flagged row carries its own
     attention box and takes no divider; the row above it drops the divider so
     the two never double up. */
  const rule =
    last || flagged || nextFlagged ? "" : "border-b border-border";
  const box = flagged ? "border-attention" : "";
  const boxTop = flagged ? "border-t" : "";
  const boxFoot = flagged && !showNote ? "border-b" : "";

  function confirmRow() {
    r.confirmObligation(o.id);
    toast(fill(copy.returnsTable.confirmedToast, { name: o.name }), {
      action: {
        label: copy.returnsTable.undo,
        onClick: () => r.resetObligation(o.id),
      },
    });
  }

  /* A reviewer reads the findings; ticking, editing, attaching and confirming
     are the expert's. */
  const readOnly = useReadOnly();
  const tick = readOnly ? null : (
    <Checkbox
      checked={selected}
      onCheckedChange={(next) => onSelectedChange(o.id, next === true)}
      aria-label={fill(copy.returnsTable.selectLabel, { name: o.name })}
      className="mt-px"
    />
  );

  if (state === "running") {
    return (
      <tr>
        <td className={cn(CELL, "pr-0", rule)}>{tick}</td>
        <td className={cn(CELL, rule)}>
          <RowTitle o={o} />
        </td>
        <td colSpan={5} className={cn(CELL, rule, "text-text-muted")}>
          <span className="inline-flex items-center gap-2 text-[13px]">
            <Loader2 className="size-3.5 animate-spin text-brand" />
            {copy.returnsTable.researching}
          </span>
        </td>
      </tr>
    );
  }

  return (
    <>
      <tr data-review-item={flagged ? "" : undefined}>
        <td
          className={cn(
            CELL,
            "pr-0",
            rule,
            box,
            boxTop,
            boxFoot,
            flagged && "border-l rounded-tl-xl",
            flagged && !showNote && "rounded-bl-xl",
          )}
        >
          {tick}
        </td>

        <td className={cn(CELL, rule, box, boxTop, boxFoot)}>
          <RowTitle o={o} />
        </td>

        <td className={cn(CELL, rule, box, boxTop, boxFoot)}>
          <ValueCell finding={frequency} onEdit={r.edit} />
        </td>

        <td className={cn(CELL, rule, box, boxTop, boxFoot)}>
          <ValueCell
            finding={deadline}
            frequency={frequency?.value}
            onEdit={r.edit}
          />
        </td>

        <td className={cn(CELL, rule, box, boxTop, boxFoot)}>
          <SourcesCell sources={sources} onOpen={onOpenSource} />
        </td>

        {/* Centred, and spanning the concern row below when there is one, so the
            Attach button sits on the middle line of the whole box — not the top
            of a tall row. */}
        <td
          rowSpan={showNote ? 2 : 1}
          className={cn(
            "px-4 py-4 align-middle",
            rule,
            box,
            boxTop,
            flagged && "border-b",
          )}
        >
          <AttachCell o={o} r={r} />
        </td>

        {/* The status and its button, centred over the whole box like Attach. As
            the box's right edge it carries the right and (when it spans the
            concern row) bottom-right corner. */}
        <td
          rowSpan={showNote ? 2 : 1}
          className={cn(
            "px-4 py-4 align-middle",
            rule,
            box,
            boxTop,
            flagged && "border-r border-b rounded-tr-xl rounded-br-xl",
          )}
        >
          <StatusAction
            state={state}
            onConfirm={confirmRow}
            onUndo={() => r.resetObligation(o.id)}
          />
        </td>
      </tr>

      {/* The concern closes the flagged box, aligned under the return type and
          running across to the deadline column. */}
      {showNote && (
        <tr>
          {/* Starts under the checkbox, so the note's left edge lines up with
              the row's first control. */}
          <td
            colSpan={4}
            className={cn("px-4 pb-4", box, "border-l border-b rounded-bl-xl")}
          >
            <AttentionNote className="max-w-none">{concern}</AttentionNote>
          </td>
          {/* Only the Sources column is left to close here — the Attach and
              status cells span down from the row above. */}
          <td className={cn(box, "border-b")} />
        </tr>
      )}
    </>
  );
}

function RowTitle({ o }: { o: ObligationRun }) {
  return (
    <div className="min-w-0">
      <p className="text-[15px] font-medium leading-5 text-heading">{o.name}</p>
      {o.localName && (
        <p className="mt-1 leading-5 text-text-muted">{o.localName}</p>
      )}
    </div>
  );
}

/**
 * A frequency or deadline value, with a pen beside it to correct it in place.
 * Editing keeps the agent's original value and the reason alongside the
 * correction — the audit trail the product is sold on.
 */
function ValueCell({
  finding,
  frequency,
  onEdit,
}: {
  finding: Finding | null;
  /** For a deadline rule: the period it counts from, to work out the date. */
  frequency?: string;
  onEdit: (finding: Finding, value: string, reason: string) => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const readOnly = useReadOnly();

  if (!finding || !finding.value) {
    return <span className="text-text-faint">{copy.returnsTable.none}</span>;
  }

  if (editing) {
    return (
      <ValueEditForm
        initial={finding.value}
        onCancel={() => setEditing(false)}
        onSave={(value, reason) => {
          onEdit(finding, value, reason);
          setEditing(false);
        }}
      />
    );
  }

  /* A deadline written as a rule ("EOP + 20 days") shows the date it next
     falls on beside it, so the expert can check the rule against a real day. */
  const days = deadlineDays(finding.value);
  const due = nextDeadline(finding.value, frequency);

  return (
    <div className="min-w-0">
      {/* The pen follows the value on its own line, so it lands in the same
          place in every row and both columns. */}
      <div className="flex items-start gap-1.5">
        <p
          className="min-w-0 leading-5 text-text"
          data-numeric
          title={
            days !== null
              ? fill(copy.returnsTable.deadlineRuleTitle, { days })
              : undefined
          }
        >
          {finding.value}
        </p>
        {!readOnly && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label={fill(copy.returnsTable.edit, { label: finding.label })}
            className="grid size-5 shrink-0 place-items-center rounded text-text-faint transition-colors hover:bg-wash hover:text-text"
          >
            <Pencil className="size-3.5" strokeWidth={1.75} />
          </button>
        )}
      </div>
      {finding.detail && (
        <p className="mt-1 text-[13px] leading-5 text-text-muted">
          {finding.detail}
        </p>
      )}
      {/* The next concrete due date sits under the detail, so the rule and its
          plain-English note read first and the date lands as the takeaway. */}
      {due && (
        <p className="mt-1.5 text-[13px] font-medium leading-5 text-text" data-numeric>
          {fill(copy.returnsTable.nextDue, { date: formatDate(due.toISOString()) })}
        </p>
      )}
      {finding.originalValue && (
        <p className="mt-1.5 text-[12px] leading-relaxed text-text-faint">
          {fill(copy.returnsTable.agentProposed, {
            value: finding.originalValue,
          })}
          {finding.editReason
            ? ` ${fill(copy.returnsTable.corrected, {
                reason: finding.editReason,
              })}`
            : ""}
        </p>
      )}
    </div>
  );
}

/** Correcting a value in place: the rationale is optional and kept with the
    record; the agent's original is always retained by the hook. */
function ValueEditForm({
  initial,
  onCancel,
  onSave,
}: {
  initial: string;
  onCancel: () => void;
  onSave: (value: string, reason: string) => void;
}) {
  const [value, setValue] = React.useState(initial);
  const [reason, setReason] = React.useState("");
  const canSave = value.trim() !== "";

  return (
    <div className="max-w-xs space-y-2.5">
      <label className="block text-[12px] text-text-muted">
        {copy.returnsTable.editValueLabel}
        <Input
          autoFocus
          value={value}
          onFocus={(e) => e.target.select()}
          onChange={(e) => setValue(e.target.value)}
          className="mt-1 h-8 text-[13px]"
        />
      </label>

      <label className="block text-[12px] text-text-muted">
        {copy.returnsTable.editReasonLabel}{" "}
        <span className="text-text-faint">
          {copy.returnsTable.editReasonOptional}
        </span>
        <Textarea
          rows={2}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={copy.returnsTable.editReasonPlaceholder}
          className="mt-1 text-[13px]"
        />
      </label>

      <div className="flex items-center gap-3">
        <Button
          size="sm"
          variant="primary"
          disabled={!canSave}
          onClick={() => onSave(value.trim(), reason.trim())}
        >
          {copy.returnsTable.editSave}
        </Button>
        <button
          type="button"
          onClick={onCancel}
          className="text-[13px] font-medium text-text-muted transition-colors hover:text-text"
        >
          {copy.returnsTable.editCancel}
        </button>
      </div>
    </div>
  );
}

/** Every document behind this return type's values, each opening its passage. */
function SourcesCell({
  sources,
  onOpen,
}: {
  sources: Evidence[];
  onOpen: (evidence: Evidence) => void;
}) {
  if (sources.length === 0) {
    return <span className="text-text-faint">{copy.returnsTable.none}</span>;
  }
  return (
    <ul className="space-y-3">
      {sources.map((e) => {
        const extension = extensionOf(e.url);
        const host = extension ? null : hostOf(e.url);
        return (
          <li key={e.url}>
            <button
              type="button"
              onClick={() => onOpen(e)}
              className="group/source flex w-full min-w-0 items-start gap-2.5 text-left"
            >
              <span className="-mt-0.5">
                <SourceMark extension={extension} host={host} size="sm" />
              </span>
              <span className="min-w-0 flex-1">
                {/* Wraps rather than truncating: the title is the evidence, and
                    a clipped one can't be told apart from its neighbour. */}
                <span className="block text-[14px] font-medium leading-5 text-brand transition-colors group-hover/source:text-brand-hover">
                  <SourceTitle title={e.sourceTitle} />
                </span>
                {e.locator && (
                  <span className="mt-1 block truncate text-[13px] leading-5 text-text-muted">
                    {e.locator}
                  </span>
                )}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** A wrapping link title whose arrow stays with its last word, never alone on a line. */
function SourceTitle({ title }: { title: string }) {
  const cut = title.lastIndexOf(" ");
  const head = cut === -1 ? "" : title.slice(0, cut + 1);
  const tail = cut === -1 ? title : title.slice(cut + 1);
  const underline =
    "underline decoration-brand/40 underline-offset-2 group-hover/source:decoration-brand";
  return (
    <>
      {head && <span className={underline}>{head}</span>}
      <span className="whitespace-nowrap">
        <span className={underline}>{tail}</span>
        <ArrowUpRight className="ml-1 inline size-3.5 align-[-2px]" />
      </span>
    </>
  );
}

/** The expert's own material for this return type: a popover to add, chips to
    show what's been added. */
function AttachCell({
  o,
  r,
}: {
  o: ObligationRun;
  r: ReturnType<typeof useReturns>;
}) {
  const [open, setOpen] = React.useState(false);
  const uploads = r.uploadsFor(o.id);
  const readOnly = useReadOnly();

  return (
    <div>
      {readOnly && uploads.length === 0 && (
        <span className="text-[13px] text-text-faint">{copy.returnsTable.noAttachments}</span>
      )}
      {!readOnly && (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button size="sm" variant="secondary" className="-my-1.5">
            <Paperclip />
            {copy.returnsTable.attachAction}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-3" align="end">
          <AddFileOrLink
            hint={copy.returnsTable.attachHint}
            chooseLabel={copy.returnsTable.attachChoose}
            linkPlaceholder={copy.returnsTable.attachLinkPlaceholder}
            linkInvalidMessage={copy.returnsTable.attachLinkInvalid}
            accept={ACCEPT}
            onFiles={(files) => {
              for (const f of files) {
                r.addUpload(o.id, { label: f.name, kind: "file" });
              }
              setOpen(false);
            }}
            onLink={(url) => {
              r.addUpload(o.id, { label: hostOf(url) ?? url, kind: "link" });
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      )}

      {uploads.length > 0 && (
        <ul className={cn("space-y-1.5", !readOnly && "mt-4")}>
          {uploads.map((u) => (
            <li
              key={u.id}
              className="flex items-center gap-1.5 rounded-md border border-border bg-surface-sunken px-2 py-1 text-[12px] text-text-muted"
            >
              {u.kind === "file" ? (
                <Paperclip className="size-3 shrink-0 text-text-faint" />
              ) : (
                <Link2 className="size-3 shrink-0 text-text-faint" />
              )}
              <span className="min-w-0 flex-1 truncate">{u.label}</span>
              {!readOnly && (
              <button
                type="button"
                onClick={() => r.removeUpload(o.id, u.id)}
                aria-label={fill(copy.returnsTable.removeAttachment, {
                  label: u.label,
                })}
                className="grid size-4 place-items-center rounded text-text-faint transition-colors hover:text-text"
              >
                <Trash2 className="size-3" />
              </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * The return type's status in words on the first line, with the one action
 * that follows from it beneath — the same two-line shape in every row, so the
 * column reads straight down under its header.
 */
function StatusAction({
  state,
  onConfirm,
  onUndo,
}: {
  state: Exclude<RowState, "running">;
  onConfirm: () => void;
  onUndo: () => void;
}) {
  const label = {
    confirmed: copy.returnsTable.confirmed,
    needs_review: copy.returnsTable.needsReview,
    cross_checked: copy.returnsTable.crossChecked,
  }[state];
  const tone = {
    confirmed: "text-settled",
    needs_review: "text-attention-text",
    cross_checked: "text-text-muted",
  }[state];
  const dot = {
    confirmed: "bg-settled",
    needs_review: "bg-attention",
    cross_checked: "bg-border-strong",
  }[state];
  const readOnly = useReadOnly();

  /* Read-only, the status stands alone in the flow: there is no action
     beneath it to float above. */
  if (readOnly) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-2 whitespace-nowrap text-[13px] font-medium leading-5",
          tone,
        )}
      >
        <span aria-hidden className={cn("size-1.5 rounded-full", dot)} />
        {label}
      </span>
    );
  }

  return (
    // The button is the only thing in the flow, so it centres on the row's
    // middle line level with the Attach button; the status eyebrow floats just
    // above it rather than pushing it down.
    <div className="relative flex justify-start">
      <span
        className={cn(
          "absolute bottom-full left-0 mb-2 inline-flex items-center gap-2 whitespace-nowrap text-[13px] font-medium leading-5",
          tone,
        )}
      >
        <span aria-hidden className={cn("size-1.5 rounded-full", dot)} />
        {label}
      </span>

      {state === "confirmed" ? (
        <Button size="sm" variant="ghost" onClick={onUndo} className="-ml-3">
          <RotateCcw strokeWidth={1.75} />
          {copy.returnsTable.undo}
        </Button>
      ) : (
        <Button
          size="sm"
          variant={state === "needs_review" ? "primary" : "secondary"}
          onClick={onConfirm}
        >
          <Check />
          {copy.returnsTable.confirm}
        </Button>
      )}
    </div>
  );
}
