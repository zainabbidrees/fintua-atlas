"use client";

import * as React from "react";
import { ArrowUpRight, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import type { Finding } from "@/lib/types";

/**
 * One extracted value, with the passage it came from.
 *
 * A cell in a two-up grid rather than a full-width row: the values are short,
 * so a row per finding spent the page's height on whitespace. Label sits above
 * the value because the cell is too narrow to carry both on one line.
 *
 * Kept deliberately light. An earlier pass wrapped the quote in its own
 * bordered card inside an already-bordered row and gave every row two full-size
 * buttons. The evidence is now an indented rule, only findings that need a
 * decision carry one, and the flag is the rule down the edge — the words
 * "Requires review" beside it said the same thing twice.
 */
export function FindingRow({
  finding,
  full,
  onConfirm,
  onEdit,
}: {
  finding: Finding;
  /** Spans both columns, for a trailing cell with no partner. */
  full?: boolean;
  onConfirm: () => void;
  onEdit: (value: string, reason: string) => void;
}) {
  const flagged = finding.state === "needs_review";
  const [open, setOpen] = React.useState(flagged);
  const [editing, setEditing] = React.useState(false);

  const settled = finding.state === "confirmed" || finding.state === "edited";

  return (
    <li className={cn("relative bg-surface", full && "sm:col-span-2")}>
      {flagged && (
        <span aria-hidden className="absolute inset-y-0 left-0 w-[2px] bg-attention" />
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-start gap-3 px-5 py-3.5 text-left transition-colors hover:bg-surface-sunken/50"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-[12px] text-text-faint">{finding.label}</span>
          <span className="mt-0.5 block text-[14px] text-text">{finding.value}</span>
          {finding.detail && (
            <span className="mt-0.5 block text-[13px] leading-relaxed text-text-muted">
              {finding.detail}
            </span>
          )}
        </span>

        <span className="mt-0.5 flex shrink-0 items-center gap-2.5">
          {settled && (
            <Check
              aria-label={finding.state === "edited" ? "Corrected" : "Confirmed"}
              className="size-3.5 text-settled"
            />
          )}

          <ChevronDown
            aria-hidden
            className={cn(
              "size-3.5 text-text-faint transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
              open && "rotate-180",
            )}
          />
        </span>
      </button>

      {open && (
        <div className="px-5 pb-4">
          {finding.concern && (
            <p className="mb-3 max-w-[62ch] text-[13px] leading-relaxed text-text">
              {finding.concern}
            </p>
          )}

          {/* A rule, not a box — the row is already a container. */}
          <figure className="border-l border-border-strong pl-4">
            <blockquote className="max-w-[62ch] text-[13px] leading-relaxed text-text-muted">
              {finding.evidence.quote}
            </blockquote>
            <figcaption className="mt-1.5 truncate text-[12px] text-text-faint">
              <a
                href={finding.evidence.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-text-muted transition-colors hover:text-brand hover:underline"
              >
                {finding.evidence.sourceTitle}
                <ArrowUpRight className="size-3" />
              </a>
              {finding.evidence.locator && ` · ${finding.evidence.locator}`}
            </figcaption>
          </figure>

          {finding.originalValue && (
            <p className="mt-3 max-w-[62ch] text-[12px] leading-relaxed text-text-faint">
              Agent proposed “{finding.originalValue}”.
              {finding.editReason && ` Corrected: ${finding.editReason}`}
            </p>
          )}

          {editing ? (
            <EditForm
              initial={finding.value}
              onCancel={() => setEditing(false)}
              onSave={(value, reason) => {
                onEdit(value, reason);
                setEditing(false);
              }}
            />
          ) : (
            <div className="mt-3 flex items-center gap-4">
              {/* Only an undecided finding gets a decision button. Corroborated
                  ones are settled by the single action in the header. */}
              {flagged && (
                <Button size="sm" variant="primary" onClick={onConfirm}>
                  Confirm
                </Button>
              )}
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="text-[13px] font-medium text-text-muted transition-colors hover:text-brand"
              >
                Correct this
              </button>
            </div>
          )}
        </div>
      )}
    </li>
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
