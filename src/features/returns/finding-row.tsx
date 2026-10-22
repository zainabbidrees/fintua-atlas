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
 * Kept deliberately light. An earlier pass wrapped the quote in its own
 * bordered card inside an already-bordered row, put the attribution on a
 * wrapping second line, and gave every row two full-size buttons — one of them
 * solid brand, repeated eight times down the page. The evidence is now an
 * indented rule rather than a box, and only findings that actually need a
 * decision carry a decision button.
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
  const [open, setOpen] = React.useState(flagged);
  const [editing, setEditing] = React.useState(false);

  const settled = finding.state === "confirmed" || finding.state === "edited";

  return (
    <li className="relative border-b border-border last:border-0">
      {flagged && (
        <span aria-hidden className="absolute inset-y-0 left-0 w-[2px] bg-attention" />
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full flex-col gap-1 px-5 py-3.5 text-left transition-colors hover:bg-surface-sunken/50 sm:flex-row sm:items-baseline sm:gap-5"
      >
        <span className="text-[12px] uppercase tracking-[0.06em] text-text-faint sm:w-36 sm:shrink-0 sm:text-[13px] sm:normal-case sm:tracking-normal">
          {finding.label}
        </span>

        <span className="min-w-0 flex-1">
          <span className="text-[14px] text-text">{finding.value}</span>
          {finding.detail && (
            <span className="mt-0.5 block text-[13px] leading-relaxed text-text-muted">
              {finding.detail}
            </span>
          )}
        </span>

        <span className="absolute right-5 top-3.5 flex shrink-0 items-center gap-2.5 sm:static">
          {flagged ? (
            <span className="hidden text-[12px] font-medium text-attention-text sm:inline">
              Requires review
            </span>
          ) : settled ? (
            <Check
              aria-label={finding.state === "edited" ? "Corrected" : "Confirmed"}
              className="size-3.5 text-settled"
            />
          ) : null}

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
        <div className="px-5 pb-4 sm:pl-[12.25rem]">
          {finding.concern && (
            <p className="mb-3 max-w-[62ch] text-[13px] leading-relaxed text-attention-text">
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
