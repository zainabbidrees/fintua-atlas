"use client";

import * as React from "react";
import { Check, Pencil, RotateCcw, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input, Textarea } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { SourceBlock } from "@/components/domain/source-block";
import { cn } from "@/lib/cn";
import { copy, fill } from "@/lib/copy";
import type { Finding, FindingState } from "@/lib/types";

/**
 * One setting the agent established for this return, with its status and proof.
 *
 * A review surface, not a form: each value states what the agent found, says
 * plainly whether it is settled or still needs a human, and keeps the source
 * one click away. The decision is a row of icon actions — correct, confirm,
 * undo — and a checkbox feeds the selection bar for acting on several at once.
 */
export function FindingRow({
  finding,
  selected,
  onSelectedChange,
  onConfirm,
  onEdit,
  onReset,
  onRestore,
  onDelete,
}: {
  finding: Finding;
  selected: boolean;
  onSelectedChange: (selected: boolean) => void;
  onConfirm: () => void;
  onEdit: (value: string, reason: string) => void;
  /** Reverts a settled value to the agent's original — the per-row undo. */
  onReset: () => void;
  /** Puts the finding back as it was — the undo behind the confirm toast. */
  onRestore: (finding: Finding) => void;
  /** Drops this finding from the return — the Delete in the review modal. */
  onDelete: () => void;
}) {
  const flagged = finding.state === "needs_review";
  const unconfirmed = flagged || finding.state === "corroborated";
  const settled = finding.state === "confirmed" || finding.state === "edited";
  const [editing, setEditing] = React.useState(false);
  /* Flagged findings carry their concern and decision in a modal, opened by
     clicking anywhere on the row, rather than spelling both out inline. */
  const [reviewOpen, setReviewOpen] = React.useState(false);

  /* The whole flagged row is the target. Clicks that land on its own controls
     — the checkbox, Edit, the source link — are left to those, and the edit
     form never opens the modal from under the expert's hands. The alert icon
     keeps its own handler so keyboard users have a focusable way in. */
  function handleRowClick(e: React.MouseEvent) {
    if (!flagged || editing) return;
    if ((e.target as HTMLElement).closest("button, a, input, label")) return;
    setReviewOpen(true);
  }

  /* Confirming is reversible: it fires a toast carrying the value and an Undo
     that restores this exact finding, so there's no modal to dismiss and no
     dead end if the wrong one was cleared. */
  function confirmValue() {
    const prior = finding;
    onConfirm();
    toast(`${finding.label} confirmed`, {
      description: finding.value,
      action: { label: "Undo", onClick: () => onRestore(prior) },
    });
  }

  return (
    <li
      onClick={handleRowClick}
      // The jump-to-review control walks the flagged rows by this marker.
      data-review-item={flagged ? "" : undefined}
      className={cn(
        "relative overflow-hidden rounded-xl border px-5 py-3.5 scroll-mt-4",
        // Needs-review tints the whole row amber — the same stroke as the
        // step-one filing card, over a soft wash — so it reads as flagged at a
        // glance. The whole tinted row is clickable for its review.
        flagged
          ? "cursor-pointer border-attention-edge bg-attention-quiet/40 transition-colors hover:bg-attention-quiet/60"
          : "border-border bg-surface",
      )}
    >
      <div className="flex items-start gap-3">
        {/* Selection for the bulk bar — distinct from the per-row decision. */}
        <Checkbox
          checked={selected}
          onCheckedChange={(next) => onSelectedChange(next === true)}
          aria-label={`Select ${finding.label}`}
          className="mt-0.5"
        />

        <div className="min-w-0 flex-1">
          {/* The finding reads across one row: the answer and its decision on
              the left, its status and source on the right. Stacks below sm. */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:justify-between sm:gap-6">
            {/* Left — the answer, with the decision buttons below it. */}
            <div className="min-w-0 flex-1">
              <div className="min-w-0">
                {/* Label and, for a flagged finding, its alert sit together —
                    the review affordance reads right beside the value it
                    questions, not stranded across the row. */}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-[12px] text-text-faint">{finding.label}</span>
                  {flagged && (
                    <button
                      type="button"
                      onClick={() => setReviewOpen(true)}
                      aria-label={fill(copy.review.triggerAria, { label: finding.label })}
                      title={copy.review.trigger}
                      className="inline-flex shrink-0 items-center justify-center rounded-md border border-attention-edge bg-attention-quiet p-1 text-attention-text transition-colors hover:border-attention/50 active:scale-[0.95]"
                    >
                      <TriangleAlert className="size-3.5" />
                    </button>
                  )}
                </div>
                <span className="mt-0.5 block text-[15px] font-medium text-text">
                  {finding.value}
                </span>
                {finding.detail && (
                  <span className="mt-1 block text-[13px] leading-relaxed text-text-muted">
                    {finding.detail}
                  </span>
                )}

                {/* The concern itself is no longer spelled out inline — it
                    lives in the review modal the row's alert opens. */}

                {/* Provenance of a human correction. */}
                {finding.originalValue && (
                  <p className="mt-2 max-w-[60ch] text-[12px] leading-relaxed text-text-faint">
                    Agent proposed “{finding.originalValue}”.
                    {finding.editReason && ` Corrected: ${finding.editReason}`}
                  </p>
                )}

                {editing && (
                  <EditForm
                    initial={finding.value}
                    onCancel={() => setEditing(false)}
                    onSave={(value, reason) => {
                      onEdit(value, reason);
                      setEditing(false);
                    }}
                  />
                )}
              </div>

              {/* Edit, confirm and undo sit below the value with room between
                  them. Confirm leads while the value still needs a human; undo
                  appears only once it is settled. */}
              {!editing && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <ChipAction tone="edit" onClick={() => setEditing(true)}>
                    <Pencil className="size-3" strokeWidth={1.75} />
                    Edit
                  </ChipAction>
                  {/* Cross-checked values confirm inline; flagged ones carry
                      Confirm inside the review modal, beside the concern. */}
                  {unconfirmed && !flagged && (
                    <ChipAction tone="confirm" onClick={confirmValue}>
                      <Check className="size-3.5" />
                      Confirm
                    </ChipAction>
                  )}
                  {settled && (
                    <ChipAction onClick={onReset}>
                      <RotateCcw className="size-3.5" strokeWidth={1.75} />
                      Undo
                    </ChipAction>
                  )}
                </div>
              )}
            </div>

            {/* Right — the evidence: the status and the source. */}
            <div className="flex shrink-0 flex-col items-start gap-2.5 sm:w-72 sm:pl-6">
              <StatusTag state={finding.state} />

              {/* The same gray source card as step one, so a source reads the
                  same way across the flow. */}
              <SourceBlock
                className="w-full"
                url={finding.evidence.url}
                title={finding.evidence.sourceTitle}
                meta={[finding.evidence.publisher, finding.evidence.locator]}
              />
            </div>
          </div>
        </div>
      </div>

      {/* The flagged finding in full: the agent's concern, and the three ways
          out of it. Confirm accepts the value and settles the row; Delete drops
          it from the return; Move forward closes and leaves it flagged. */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent>
          <DialogTitle>{finding.label}</DialogTitle>
          <DialogDescription>{finding.value}</DialogDescription>

          {finding.concern && (
            <div className="mt-4 rounded-md bg-attention-quiet px-3.5 py-3 text-[13px] leading-relaxed text-attention-text">
              <span className="mb-1 block text-[11px] font-medium uppercase tracking-[0.08em] text-attention-text/70">
                {copy.review.concernLabel}
              </span>
              {finding.concern}
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setReviewOpen(false)}>
              {copy.review.moveOn}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                onDelete();
                setReviewOpen(false);
              }}
            >
              {copy.review.delete}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                confirmValue();
                setReviewOpen(false);
              }}
            >
              {copy.review.confirm}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </li>
  );
}

/**
 * A small action chip for the per-value toolbar: a quiet grey background with a
 * coloured icon and label — correct reads blue, confirm green, undo grey. Kept
 * deliberately small so it never reads as a page CTA.
 */
function ChipAction({
  tone = "default",
  onClick,
  children,
}: {
  tone?: "default" | "edit" | "confirm";
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-md bg-wash px-2 py-1 text-[12px] font-medium transition-[filter,transform] hover:brightness-95 active:scale-[0.96]",
        tone === "edit"
          ? "text-[#2563eb]"
          : tone === "confirm"
            ? "text-settled"
            : "text-text-muted",
      )}
    >
      {children}
    </button>
  );
}

/** Correcting a value: the rationale is optional, retained with the record
 * when given. The agent's original value is always kept. */
function EditForm({
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
    <div className="mt-3 max-w-lg space-y-3">
      <label className="block text-[13px] text-text-muted">
        Corrected value
        <Input
          autoFocus
          value={value}
          /* Pre-filled with the agent's value, usually replaced wholesale. */
          onFocus={(e) => e.target.select()}
          onChange={(e) => setValue(e.target.value)}
          className="mt-1.5"
        />
      </label>

      <label className="block text-[13px] text-text-muted">
        Rationale <span className="text-text-faint">(optional)</span>
        <Textarea
          rows={2}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Retained with the record for audit purposes"
          className="mt-1.5"
        />
      </label>

      <div className="flex items-center gap-4">
        <Button
          size="sm"
          variant="primary"
          disabled={!canSave}
          onClick={() => onSave(value.trim(), reason.trim())}
        >
          Update
        </Button>
        <button
          type="button"
          onClick={onCancel}
          className="text-[13px] font-medium text-text-muted transition-colors hover:text-text"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/** The status in words, so no mark is a mystery. */
function StatusTag({ state }: { state: FindingState }) {
  if (state === "confirmed" || state === "edited") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 text-[12px] font-medium text-settled">
        <Check className="size-3.5" />
        {state === "edited" ? "Corrected" : "Confirmed"}
      </span>
    );
  }

  // Needs-review and cross-checked carry no status word here: needs-review is
  // already signalled by the card amber stroke and concern box (as in step one),
  // and cross-checked by its value and source. Only settled earns a label.
  return null;
}
