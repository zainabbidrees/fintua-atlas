"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { copy } from "@/lib/copy";
import { useReadOnly } from "./read-only";

/**
 * The draft action pair that sits in every step's header: a quiet Discard
 * alongside Save draft.
 *
 * The two travel together so the header reads the same on every step. Discard
 * is ghost-weight — the destructive confirm is carried by the dialog, not by a
 * red button sitting over the whole step — and it asks before throwing the
 * draft away. Save draft keeps its filled weight as the step's own standing
 * action.
 *
 * `onDiscard` is what abandoning the draft means on this step: the setup step
 * resets itself in place; the later steps hand back to Countries. The confirm
 * and its copy are the same either way.
 */
export function DraftActions({ onDiscard }: { onDiscard: () => void }) {
  const [discardOpen, setDiscardOpen] = React.useState(false);
  /* A draft is the builder's; someone only reading has none to keep or drop. */
  const readOnly = useReadOnly();

  function confirmDiscard() {
    onDiscard();
    setDiscardOpen(false);
  }

  if (readOnly) return null;

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => setDiscardOpen(true)}>
          {copy.page.discard}
        </Button>
        <Button variant="filled" size="sm">
          {copy.page.saveDraft}
        </Button>
      </div>

      <Dialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <DialogContent>
          <DialogTitle>{copy.discardDraft.title}</DialogTitle>
          <DialogDescription>{copy.discardDraft.hint}</DialogDescription>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDiscardOpen(false)}>
              {copy.discardDraft.cancel}
            </Button>
            <Button variant="danger" onClick={confirmDiscard}>
              {copy.discardDraft.confirm}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
