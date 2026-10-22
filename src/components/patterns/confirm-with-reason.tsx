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

/**
 * Confirms a removal AND captures why.
 *
 * The reason is the point. A tax expert's judgement — "superseded by the 2026
 * circular" — is exactly the knowledge the manual process kept in someone's
 * head and the automated one would otherwise throw away. It is also the answer
 * to "why did you exclude this?" three years later in an audit.
 *
 * The reason is required: an empty box means the knowledge is lost anyway.
 */
export function ConfirmWithReason({
  open,
  onOpenChange,
  title,
  hint,
  placeholder,
  confirmLabel,
  cancelLabel,
  destructive = true,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  hint: string;
  placeholder: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = React.useState("");

  React.useEffect(() => {
    if (open) setReason("");
  }, [open]);

  const canConfirm = reason.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{hint}</DialogDescription>

        <Textarea
          autoFocus
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={placeholder}
          className="mt-4"
        />

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? "danger" : "primary"}
            disabled={!canConfirm}
            onClick={() => {
              onConfirm(reason.trim());
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
