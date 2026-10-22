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
 * The reason is the point. A specialist's judgement — "superseded by the 2026
 * circular" — is exactly the knowledge the manual process kept in someone's
 * head and the automated one would otherwise discard. It is also the answer to
 * "on what basis was this excluded?" years later under audit.
 *
 * Required: an empty box loses the knowledge anyway.
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* Radix unmounts this subtree on close, so the field state below is
            fresh by construction — no effect resetting it after the fact. */}
        <Body
          title={title}
          hint={hint}
          placeholder={placeholder}
          confirmLabel={confirmLabel}
          cancelLabel={cancelLabel}
          destructive={destructive}
          onCancel={() => onOpenChange(false)}
          onConfirm={(reason) => {
            onConfirm(reason);
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
  placeholder,
  confirmLabel,
  cancelLabel,
  destructive,
  onCancel,
  onConfirm,
}: {
  title: string;
  hint: string;
  placeholder: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = React.useState("");
  const canConfirm = reason.trim().length > 0;

  return (
    <>
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
        <Button variant="ghost" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button
          variant={destructive ? "danger" : "primary"}
          disabled={!canConfirm}
          onClick={() => onConfirm(reason.trim())}
        >
          {confirmLabel}
        </Button>
      </div>
    </>
  );
}
