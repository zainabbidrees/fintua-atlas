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
 * Asks two things when a document is added, and nothing more.
 *
 * Its type, because a completed return carries far more than a guidance note
 * and the agent should weigh them differently. And a note, because the most
 * common thing a specialist needs to say is that their copy supersedes the one
 * published online.
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* Unmounted on close by Radix, so the fields start clean. */}
        <Body
          fileName={fileName}
          onCancel={() => onOpenChange(false)}
          onSave={(kind, note) => {
            onSave(kind, note);
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function Body({
  fileName,
  onCancel,
  onSave,
}: {
  fileName: string | null;
  onCancel: () => void;
  onSave: (kind: DocumentKind, note: string) => void;
}) {
  const [kind, setKind] = React.useState<DocumentKind | null>(null);
  const [note, setNote] = React.useState("");

  return (
    <>
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
        <Button variant="ghost" onClick={onCancel}>
          {copy.documents.cancel}
        </Button>
        <Button
          variant="primary"
          disabled={!kind}
          onClick={() => kind && onSave(kind, note.trim())}
        >
          {copy.documents.save}
        </Button>
      </div>
    </>
  );
}
