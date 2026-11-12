"use client";

import * as React from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { copy } from "@/lib/copy";

/**
 * The right-hand pair of every step's pinned footer: Save changes beside
 * Continue.
 *
 * Continue does not move on by itself. It asks first — moving to the next
 * step hands this step's work on — and only Confirm in that dialog runs
 * `onContinue`. Back closes the dialog and leaves the step as it was.
 *
 * `onSave` is what saving means on the step; `saveDisabled` greys it while
 * there is nothing to save.
 *
 * `onNext`, when given, adds a quiet Next beside the primary action that
 * advances to the following step without sending this one on — so the whole
 * country can be compiled before anything goes to a reviewer. It is a plain
 * move, reversible by stepping back, so it skips the confirm dialog.
 */
export function ContinueActions({
  onSave,
  saveDisabled = false,
  saveLabel = copy.page.saveChanges,
  onContinue,
  continueDisabled = false,
  continueLabel = copy.page.continue,
  onNext,
  nextLabel = copy.page.next,
}: {
  onSave: () => void;
  saveDisabled?: boolean;
  saveLabel?: string;
  onContinue: () => void;
  continueDisabled?: boolean;
  /** The primary button's label — e.g. "Send for approval" on a step that
      goes to a reviewer. */
  continueLabel?: string;
  /** Advances to the next step without sending this one for approval. Omit on
      steps where Continue already moves on without sending. */
  onNext?: () => void;
  nextLabel?: string;
}) {
  const [asking, setAsking] = React.useState(false);

  return (
    <>
      <Button variant="secondary" disabled={saveDisabled} onClick={onSave}>
        {saveLabel}
      </Button>
      {onNext && (
        <Button variant="secondary" disabled={continueDisabled} onClick={onNext}>
          {nextLabel}
          <ArrowRight />
        </Button>
      )}
      <Button variant="primary" disabled={continueDisabled} onClick={() => setAsking(true)}>
        {continueLabel}
        <ArrowRight />
      </Button>

      <Dialog open={asking} onOpenChange={setAsking}>
        <DialogContent>
          <DialogTitle>{copy.page.confirmContinue}</DialogTitle>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setAsking(false)}>
              {copy.page.confirmBack}
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setAsking(false);
                onContinue();
              }}
            >
              {copy.page.confirm}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
