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
 * Two (or more) answers that can't both be right.
 *
 * Deliberately never auto-resolved — not even in favour of the expert's own
 * upload. Silently preferring one source hides the disagreement, and in tax a
 * disagreement is the most important thing on the screen. Both options are
 * shown with where they came from, a human picks, and the reasoning is kept.
 *
 * Built once here because the same moment recurs: a duplicate document in
 * set-up, a conflicting rate or deadline once values are extracted.
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
  const [chosen, setChosen] = React.useState<string | null>(null);
  const [reason, setReason] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setChosen(null);
      setReason("");
    }
  }, [open]);

  const canConfirm = chosen !== null && (!requireReason || reason.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
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
                <span className="text-sm font-medium text-text">
                  {option.label}
                </span>
                <span className="text-xs text-text-muted">
                  {option.attribution}
                </span>
                {option.meta && (
                  <span className="text-xs text-text-faint">{option.meta}</span>
                )}
              </button>
            );
          })}
        </div>

        {requireReason && (
          <div className="mt-4">
            <label className="text-sm font-medium text-text">
              {reasonLabel}
            </label>
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
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </Button>
          <Button
            variant="primary"
            disabled={!canConfirm}
            onClick={() => {
              if (!chosen) return;
              onConfirm(chosen, reason.trim());
              onOpenChange(false);
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
