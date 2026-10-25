"use client";

import * as React from "react";
import { ArrowUpRight, Check, ChevronDown, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import type { Finding, FindingState } from "@/lib/types";

/**
 * One setting the agent established for this return, with its status and proof.
 *
 * This is a review surface, not a form. Each cell states a value the agent
 * found, says plainly whether it is settled or still needs a human, and keeps
 * the source one click away. An earlier pass hid the status behind a bare tick
 * and the action behind a chevron, so the screen read as a grid of broken
 * inputs — you couldn't tell what anything was. Status is now a word, the
 * source sits in view, and the decision is a visible button.
 */
export function FindingRow({
  finding,
  onConfirm,
  onEdit,
}: {
  finding: Finding;
  onConfirm: () => void;
  onEdit: (value: string, reason: string) => void;
}) {
  const flagged = finding.state === "needs_review";
  /* Both the uncertain (needs_review) and the cross-checked values wait on an
     explicit human confirm — nothing is accepted in bulk. */
  const unconfirmed = flagged || finding.state === "corroborated";
  const [showPassage, setShowPassage] = React.useState(flagged);
  const [editing, setEditing] = React.useState(false);

  return (
    <li
      data-review-item={unconfirmed ? "" : undefined}
      className="relative bg-surface px-5 py-4"
    >
      {flagged && (
        <span aria-hidden className="absolute inset-y-0 left-0 w-[2px] bg-attention" />
      )}

      {/* The whole finding reads across one row: the answer and its decision on
          the left, its status and proof on the right. Stacks below sm, where
          there is no room to sit side by side. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:justify-between sm:gap-6">
        {/* Left — the answer the agent found, and the decision on it. */}
        <div className="min-w-0 flex-1">
          <span className="block text-[12px] text-text-faint">{finding.label}</span>
          <span className="mt-0.5 block text-[15px] font-medium text-text">
            {finding.value}
          </span>
          {finding.detail && (
            <span className="mt-1 block text-[13px] leading-relaxed text-text-muted">
              {finding.detail}
            </span>
          )}

          {/* What the agent is unsure about — only on the ones that need a human. */}
          {flagged && finding.concern && (
            <p className="mt-2 max-w-[60ch] text-[13px] leading-relaxed text-attention-text">
              {finding.concern}
            </p>
          )}

          {/* Provenance of a human correction. */}
          {finding.originalValue && (
            <p className="mt-2 max-w-[60ch] text-[12px] leading-relaxed text-text-faint">
              Agent proposed “{finding.originalValue}”.
              {finding.editReason && ` Corrected: ${finding.editReason}`}
            </p>
          )}

          {/* The decision, per value — never in bulk. Anything not yet
              confirmed carries its own Confirm; a settled value keeps a
              correction as the escape hatch. */}
          {!editing && (
            <div className="mt-3 flex items-center gap-4">
              {unconfirmed && (
                <Button size="sm" variant="primary" onClick={onConfirm}>
                  Confirm
                </Button>
              )}
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="text-[13px] font-medium text-brand underline decoration-brand/40 underline-offset-2 transition-colors hover:decoration-brand"
              >
                Correct this
              </button>
            </div>
          )}
        </div>

        {/* Right — the evidence, as its own panel: the status, the source as a
            real link, and a clear button to open the passage. Kept on the
            right and divided from the answer by a hairline, left-aligned so it
            reads as a column rather than text pushed into a corner. Stacks
            under the answer below sm. */}
        <div className="flex shrink-0 flex-col items-start gap-2.5 sm:w-64 sm:border-l sm:border-border sm:pl-6">
          <StatusTag state={finding.state} />

          {/* The source, unmistakably a link: a document icon, the title, and
              the arrow that marks it as opening away from the page. */}
          <a
            href={finding.evidence.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-start gap-1.5 text-[13px] text-text-muted transition-colors hover:text-brand"
          >
            <FileText
              className="mt-px size-3.5 shrink-0 text-text-faint transition-colors group-hover:text-brand"
              strokeWidth={1.75}
            />
            <span className="underline-offset-2 group-hover:underline">
              {finding.evidence.sourceTitle}
            </span>
            <ArrowUpRight className="mt-px size-3 shrink-0" />
          </a>

          {/* The passage toggle, now a button you can see — brand text, a hover
              fill, and a chevron that turns when it opens. */}
          <button
            type="button"
            onClick={() => setShowPassage((s) => !s)}
            aria-expanded={showPassage}
            className="-mx-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-[13px] font-medium text-brand transition-colors hover:bg-brand-quiet active:scale-[0.98]"
          >
            {showPassage ? "Hide passage" : "Show passage"}
            <ChevronDown
              className={cn(
                "size-3.5 transition-transform duration-200",
                showPassage && "rotate-180",
              )}
            />
          </button>
        </div>
      </div>

      {showPassage && (
        <figure className="mt-3 border-l border-border-strong pl-4">
          <blockquote className="max-w-[60ch] text-[13px] leading-relaxed text-text-muted">
            {finding.evidence.quote}
          </blockquote>
          {finding.evidence.locator && (
            <figcaption className="mt-1.5 text-[12px] text-text-faint">
              {finding.evidence.locator}
            </figcaption>
          )}
        </figure>
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
    </li>
  );
}

/** The status in words, so no mark is a mystery. */
function StatusTag({ state }: { state: FindingState }) {
  if (state === "needs_review") {
    return (
      <span className="inline-flex shrink-0 items-center rounded-full bg-attention-quiet px-2 py-0.5 text-[12px] font-medium text-attention-text ring-1 ring-inset ring-attention-edge">
        Needs review
      </span>
    );
  }

  if (state === "confirmed" || state === "edited") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 text-[12px] font-medium text-settled">
        <Check className="size-3.5" />
        {state === "edited" ? "Corrected" : "Confirmed"}
      </span>
    );
  }

  // cross-checked — the agent found the same value in more than one source,
  // and they agree; awaiting a human confirm. ("Cross-checked" is the plain
  // label for the FindingState "corroborated".)
  return (
    <span className="shrink-0 text-[12px] font-medium text-text-muted">
      Cross-checked
    </span>
  );
}

/** Correcting a value requires saying why; the agent's original is retained. */
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
  const canSave = value.trim() !== "" && reason.trim() !== "";

  return (
    <div className="mt-4 max-w-lg space-y-3">
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
        Rationale
        <Textarea
          rows={2}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Retained with the record for audit purposes"
          className="mt-1.5"
        />
      </label>

      <div className="flex items-center gap-4">
        <Button size="sm" variant="primary" disabled={!canSave} onClick={() => onSave(value.trim(), reason.trim())}>
          Save correction
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
