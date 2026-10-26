"use client";

import * as React from "react";
import { ArrowUpRight, Check, FileText, PanelRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PassageDrawer } from "./passage-drawer";
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
  onRestore,
}: {
  finding: Finding;
  onConfirm: () => void;
  /** Puts the finding back as it was — the undo behind the confirm toast. */
  onRestore: (finding: Finding) => void;
}) {
  const flagged = finding.state === "needs_review";
  /* Both the uncertain (needs_review) and the cross-checked values wait on an
     explicit human confirm — nothing is accepted in bulk. */
  const unconfirmed = flagged || finding.state === "corroborated";
  const [passageOpen, setPassageOpen] = React.useState(false);

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

          {/* The decision, per value — never in bulk. Confirming is reversible
              through the toast's Undo, so it needs no second control beside it. */}
          {unconfirmed && (
            <div className="mt-3">
              <Button size="sm" variant="primary" onClick={confirmValue}>
                Confirm
              </Button>
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
            className="group inline-flex items-start gap-1.5 text-[13px] font-medium text-brand transition-colors hover:text-brand-hover"
          >
            <FileText
              className="mt-px size-3.5 shrink-0"
              strokeWidth={1.75}
            />
            <span className="underline decoration-brand/40 underline-offset-2 group-hover:decoration-brand">
              {finding.evidence.sourceTitle}
            </span>
            <ArrowUpRight className="mt-px size-3 shrink-0" />
          </a>

          {/* Opens the source passage in a side drawer that scrolls to and
              highlights the exact wording — the quote read in its context. */}
          <button
            type="button"
            onClick={() => setPassageOpen(true)}
            className="-mx-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-[13px] font-medium text-brand transition-colors hover:bg-wash active:scale-[0.98]"
          >
            Show passage
            <PanelRight className="size-3.5" />
          </button>
        </div>
      </div>

      <PassageDrawer
        evidence={finding.evidence}
        open={passageOpen}
        onOpenChange={setPassageOpen}
      />
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

  // cross-checked (the FindingState "corroborated"): the agent found the same
  // value in more than one source and they agree, awaiting a human confirm. It
  // carries no status word — the row's value and its source already say it, and
  // only the states that need a person (needs review) or are settled
  // (confirmed/corrected) earn a label.
  return null;
}
