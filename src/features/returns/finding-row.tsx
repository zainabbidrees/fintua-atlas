"use client";

import * as React from "react";
import { ArrowUpRight, Check, ChevronDown, Pencil, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import type { Finding } from "@/lib/types";

/**
 * One extracted value, with the passage it came from.
 *
 * The passage is the whole point. Checking "is the deadline really the 20th?"
 * should cost one click, not a trip to a PDF — which is what the dev prototype
 * asked for, keeping sources on one screen and values on another.
 *
 * Flagged findings open by default: the work shouldn't have to be hunted for.
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
    <li
      className={cn(
        "relative border-b border-border last:border-0",
        flagged && "bg-attention-quiet/40",
      )}
    >
      {flagged && (
        <span aria-hidden className="absolute inset-y-0 left-0 w-[2px] bg-attention" />
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-surface-sunken/60"
      >
        <span className="w-40 shrink-0 pt-px text-[13px] text-text-muted">
          {finding.label}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span className="text-[15px] font-medium tracking-tight text-text">
              {finding.value}
            </span>
            {settled && (
              <Check
                aria-label={finding.state === "edited" ? "Corrected" : "Confirmed"}
                className="size-3.5 shrink-0 text-settled"
              />
            )}
            {finding.state === "edited" && (
              <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-faint">
                Corrected
              </span>
            )}
          </span>
          {finding.detail && (
            <span className="mt-0.5 block text-[13px] leading-relaxed text-text-muted">
              {finding.detail}
            </span>
          )}
        </span>

        {flagged && (
          <span className="hidden shrink-0 items-center gap-1.5 text-[12px] font-medium text-attention-text sm:flex">
            <TriangleAlert className="size-3.5" />
            Requires review
          </span>
        )}

        <ChevronDown
          aria-hidden
          className={cn(
            "size-4 shrink-0 text-text-faint transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="px-5 pb-5 pl-5 sm:pl-[14.25rem]">
          {finding.concern && (
            <p className="mb-3 text-[13px] leading-relaxed text-attention-text">
              {finding.concern}
            </p>
          )}

          {/* The source wording, verbatim. */}
          <figure className="rounded-lg border border-border bg-surface p-4">
            <blockquote className="text-[13px] leading-relaxed text-text">
              “{finding.evidence.quote}”
            </blockquote>
            <figcaption className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-text-faint">
              <a
                href={finding.evidence.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-brand hover:underline"
              >
                {finding.evidence.sourceTitle}
                <ArrowUpRight className="size-3" />
              </a>
              <span>· {finding.evidence.publisher}</span>
              {finding.evidence.locator && <span>· {finding.evidence.locator}</span>}
            </figcaption>
          </figure>

          {finding.originalValue && (
            <p className="mt-3 text-[12px] leading-relaxed text-text-faint">
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
            <div className="mt-3 flex flex-wrap gap-2">
              {!settled && (
                <Button size="sm" variant="primary" onClick={onConfirm}>
                  <Check />
                  Confirm
                </Button>
              )}
              <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
                <Pencil />
                Correct
              </Button>
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
    <div className="mt-3 rounded-lg border border-border bg-surface p-4">
      <label className="block text-[13px] font-medium text-text">
        Corrected value
        <Input
          autoFocus
          value={value}
          /* Pre-filled with the agent's value, which is usually replaced
             wholesale rather than appended to. */
          onFocus={(e) => e.target.select()}
          onChange={(e) => setValue(e.target.value)}
          className="mt-1.5"
        />
      </label>

      <label className="mt-3 block text-[13px] font-medium text-text">
        Rationale
        <Textarea
          rows={2}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Retained with the record for audit purposes"
          className="mt-1.5"
        />
      </label>

      <div className="mt-3 flex justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          size="sm"
          variant="primary"
          disabled={!canSave}
          onClick={() => onSave(value.trim(), reason.trim())}
        >
          Save correction
        </Button>
      </div>
    </div>
  );
}
