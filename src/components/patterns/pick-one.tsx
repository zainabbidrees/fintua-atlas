"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { cn } from "@/lib/cn";

/**
 * Two or more answers that cannot both be right.
 *
 * Never resolved automatically — not even in favour of the specialist's own
 * upload. Silently preferring one source conceals the conflict, and a conflict
 * between sources is the most important thing on the screen. Both are shown
 * with their provenance, a human selects, and the rationale is retained.
 *
 * Built generically because the moment recurs: a duplicate document at scoping,
 * a contradictory rate or deadline once values are extracted.
 */
export interface PickOneOption {
  id: string;
  label: string;
  attribution: string;
  meta?: string;
}

export function PickOne({
  open,
  onOpenChange,
  title,
  hint,
  subject,
  options,
  reasonLabel,
  reasonPlaceholder,
  confirmLabel,
  cancelLabel,
  requireReason = true,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  hint: string;
  subject?: string;
  options: PickOneOption[];
  reasonLabel: string;
  reasonPlaceholder: string;
  confirmLabel: string;
  cancelLabel: string;
  requireReason?: boolean;
  onConfirm: (optionId: string, reason: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* Radix unmounts this subtree on close, so the selection below is
            fresh by construction — no effect resetting it after the fact. */}
        <Body
          title={title}
          hint={hint}
          subject={subject}
          options={options}
          reasonLabel={reasonLabel}
          reasonPlaceholder={reasonPlaceholder}
          confirmLabel={confirmLabel}
          cancelLabel={cancelLabel}
          requireReason={requireReason}
          onCancel={() => onOpenChange(false)}
          onConfirm={(id, reason) => {
            onConfirm(id, reason);
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function Body({
  title,
  hint,
  subject,
  options,
  reasonLabel,
  reasonPlaceholder,
  confirmLabel,
  cancelLabel,
  requireReason,
  onCancel,
  onConfirm,
}: {
  title: string;
  hint: string;
  subject?: string;
  options: PickOneOption[];
  reasonLabel: string;
  reasonPlaceholder: string;
  confirmLabel: string;
  cancelLabel: string;
  requireReason: boolean;
  onCancel: () => void;
  onConfirm: (optionId: string, reason: string) => void;
}) {
  const [chosen, setChosen] = React.useState<string | null>(null);
  const [reason, setReason] = React.useState("");

  const canConfirm = chosen !== null && (!requireReason || reason.trim() !== "");

  return (
    <>
      <DialogTitle>{title}</DialogTitle>
      <DialogDescription>{hint}</DialogDescription>

      {subject && (
        <p className="mt-4 text-xs font-medium uppercase tracking-wide text-text-faint">
          {subject}
        </p>
      )}

      <div className="mt-2 space-y-2">
        {options.map((option) => {
          const selected = chosen === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setChosen(option.id)}
              aria-pressed={selected}
              className={cn(
                "flex w-full flex-col items-start gap-0.5 rounded-md border p-3 text-left transition-colors",
                selected
                  ? "border-brand bg-brand-quiet"
                  : "border-border hover:border-border-strong hover:bg-surface-sunken",
              )}
            >
              <span className="text-sm font-medium text-text">{option.label}</span>
              <span className="text-xs text-text-muted">{option.attribution}</span>
              {option.meta && (
                <span className="text-xs text-text-faint">{option.meta}</span>
              )}
            </button>
          );
        })}
      </div>

      {requireReason && (
        <div className="mt-4">
          <label className="text-sm font-medium text-text">{reasonLabel}</label>
          <Textarea
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={reasonPlaceholder}
            className="mt-1.5"
          />
        </div>
      )}

      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button
          variant="primary"
          disabled={!canConfirm}
          onClick={() => chosen && onConfirm(chosen, reason.trim())}
        >
          {confirmLabel}
        </Button>
      </div>
    </>
  );
}
