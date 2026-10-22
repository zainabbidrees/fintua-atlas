"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { copy, DOCUMENT_KIND_LABEL } from "@/lib/copy";
import type { DocumentKind } from "@/lib/types";
import { cn } from "@/lib/cn";

const KINDS = Object.keys(DOCUMENT_KIND_LABEL) as DocumentKind[];

/**
 * Asks two things when a document lands — and nothing more.
 *
 * "What is this?" because a completed example return is far more useful than a
 * guidance PDF, and the agent should treat them differently. "Anything we
 * should know?" because the single most common thing an expert wants to say is
 * that their copy is newer than the one on the website.
 */
export function DescribeDocument({
  fileName,
  open,
  onOpenChange,
  onSave,
}: {
  fileName: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (kind: DocumentKind, note: string) => void;
}) {
  const [kind, setKind] = React.useState<DocumentKind | null>(null);
  const [note, setNote] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setKind(null);
      setNote("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{copy.documents.kindQuestion}</DialogTitle>
        <DialogDescription>{fileName}</DialogDescription>

        <div className="mt-4 flex flex-wrap gap-2">
          {KINDS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              aria-pressed={kind === k}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm transition-colors",
                kind === k
                  ? "border-brand bg-brand-quiet text-brand"
                  : "border-border-strong text-text-muted hover:bg-surface-sunken hover:text-text",
              )}
            >
              {DOCUMENT_KIND_LABEL[k]}
            </button>
          ))}
        </div>

        <div className="mt-5">
          <label className="text-sm font-medium text-text">
            {copy.documents.noteQuestion}
          </label>
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={copy.documents.notePlaceholder}
            className="mt-1.5"
          />
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {copy.documents.cancel}
          </Button>
          <Button
            variant="primary"
            disabled={!kind}
            onClick={() => {
              if (!kind) return;
              onSave(kind, note.trim());
              onOpenChange(false);
            }}
          >
            {copy.documents.save}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
