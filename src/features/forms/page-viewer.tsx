"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScaleToFit } from "@/components/ui/scale-to-fit";
import { FormSheet, SHEET_H, SHEET_W } from "@/components/domain/form-sheet";
import { copy, fill } from "@/lib/copy";
import type { FormEdition, FormPage } from "@/lib/types";

/**
 * A page at reading size, with the decision on it beside it.
 *
 * The thumbnail shows the shape of a page; this is where it is read. The
 * agent's note says why it was ticked or left, so the expert is confirming a
 * stated judgement rather than guessing at one. Arrow keys page through the
 * form without leaving the viewer.
 */
export function PageViewer({
  open,
  onOpenChange,
  formName,
  edition,
  index,
  onIndexChange,
  isSelected,
  onSelectedChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formName: string;
  edition: FormEdition;
  index: number;
  onIndexChange: (index: number) => void;
  /** Omitted for an edition that has not been chosen — look, don't tick. */
  isSelected?: (page: FormPage) => boolean;
  onSelectedChange?: (page: FormPage, on: boolean) => void;
}) {
  const t = copy.taxForms;
  const total = edition.pages.length;
  const page = edition.pages[index];
  const selectable = isSelected !== undefined && onSelectedChange !== undefined;
  const checkboxId = React.useId();

  const go = (i: number) => onIndexChange(Math.min(total - 1, Math.max(0, i)));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex h-[min(58rem,calc(100dvh-2rem))] w-[min(76rem,calc(100vw-2rem))] flex-col overflow-hidden p-0 lg:flex-row"
        onKeyDown={(e) => {
          if (e.target instanceof HTMLTextAreaElement) return;
          if (e.key === "ArrowRight") go(index + 1);
          if (e.key === "ArrowLeft") go(index - 1);
        }}
      >
        <div className="min-h-0 flex-1 overflow-auto bg-wash p-4 sm:p-8 [scrollbar-width:thin]">
          <div className="mx-auto w-full max-w-[640px] shadow-[var(--shadow-overlay)]">
            <ScaleToFit width={SHEET_W} height={SHEET_H}>
              <FormSheet edition={edition} page={page} pageNumber={index + 1} />
            </ScaleToFit>
          </div>
        </div>

        <aside className="flex shrink-0 flex-col gap-5 border-t border-border p-5 lg:w-80 lg:border-l lg:border-t-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <DialogTitle>{formName}</DialogTitle>
              <DialogDescription className="mt-1 text-[13px]">
                {edition.reference} · {fill(t.edition, { edition: edition.edition })}
              </DialogDescription>
            </div>
            <DialogClose asChild>
              <Button variant="ghost" size="sm" aria-label={t.viewerClose} className="-mr-2 -mt-1 px-2">
                <X />
              </Button>
            </DialogClose>
          </div>

          <div>
            <p className="text-[13px] font-medium text-text" data-numeric>
              {fill(t.viewerOf, { n: index + 1, total })}
              <span className="font-normal text-text-faint"> · {t.kind[page.kind]}</span>
            </p>
            <p className="mt-1 text-[13px] text-text-muted">{page.summary}</p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-text-faint">
              {t.viewerWhy}
            </p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-text-muted">{page.note}</p>
          </div>

          {selectable ? (
            <label
              htmlFor={checkboxId}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border-strong px-3 py-2.5 text-[13px] font-medium text-text transition-colors hover:bg-wash"
            >
              <Checkbox
                id={checkboxId}
                checked={isSelected(page)}
                onCheckedChange={(v) => onSelectedChange(page, v === true)}
              />
              {t.viewerCarry}
            </label>
          ) : (
            <p className="rounded-lg bg-surface-sunken px-3 py-2.5 text-[13px] text-text-muted">
              {t.viewerNotChosen}
            </p>
          )}

          <div className="mt-auto">
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={() => go(index - 1)}
                disabled={index === 0}
              >
                <ArrowLeft />
                {t.viewerPrev}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={() => go(index + 1)}
                disabled={index === total - 1}
              >
                {t.viewerNext}
                <ArrowRight />
              </Button>
            </div>
            <p className="mt-2.5 hidden text-center text-[12px] text-text-faint lg:block">
              {t.viewerKeys}
            </p>
          </div>
        </aside>
      </DialogContent>
    </Dialog>
  );
}
