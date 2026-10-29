"use client";

import * as React from "react";
import { Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { copy, fill } from "@/lib/copy";
import type { FormPage } from "@/lib/mock/form-preview";

const NAME = /^[A-Za-z0-9_#]+$/;

/**
 * Adds a box the agent did not extract: its name as the return names it, what
 * it reports, and the page of the form it sits on — so the new row points back
 * at the form like every extracted one does.
 *
 * `page` opens the dialog on a page already chosen (from the page viewer); the
 * expert can still change it.
 */
export function AddBoxDialog({
  open,
  page,
  pages,
  taken,
  onOpenChange,
  onAdd,
}: {
  open: boolean;
  /** 1-based page to start on, or null to make the expert pick. */
  page: number | null;
  pages: FormPage[];
  /** Box names already in the field map, to refuse a duplicate. */
  taken: ReadonlySet<string>;
  onOpenChange: (open: boolean) => void;
  onAdd: (box: { name: string; description: string; page: number }) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* Radix unmounts on close, so each opening starts clean. */}
        {open && (
          <Body
            initialPage={page}
            pages={pages}
            taken={taken}
            onCancel={() => onOpenChange(false)}
            onAdd={(box) => {
              onAdd(box);
              onOpenChange(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function Body({
  initialPage,
  pages,
  taken,
  onCancel,
  onAdd,
}: {
  initialPage: number | null;
  pages: FormPage[];
  taken: ReadonlySet<string>;
  onCancel: () => void;
  onAdd: (box: { name: string; description: string; page: number }) => void;
}) {
  const t = copy.fieldMap;
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [page, setPage] = React.useState<number | null>(initialPage);
  /* Errors show once the expert has tried to add, not while they type. */
  const [tried, setTried] = React.useState(false);

  const trimmed = name.trim();
  const nameError = !trimmed
    ? t.boxNameRequired
    : !NAME.test(trimmed)
      ? t.boxNameInvalid
      : taken.has(trimmed.toLowerCase())
        ? fill(t.boxNameTaken, { name: trimmed })
        : null;
  const pageError = page === null ? t.pageRequired : null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setTried(true);
    if (nameError || pageError || page === null) return;
    onAdd({ name: trimmed, description: description.trim(), page });
  }

  return (
    <form onSubmit={submit} noValidate>
      <DialogTitle>{t.addBoxTitle}</DialogTitle>
      <DialogDescription>{t.addBoxHint}</DialogDescription>

      <div className="mt-5 space-y-5">
        <div className="grid gap-2">
          <label htmlFor="add-box-name" className="text-sm font-medium text-text">
            {t.boxName}
          </label>
          <Input
            id="add-box-name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.boxNamePlaceholder}
            aria-invalid={tried && nameError ? true : undefined}
            aria-describedby="add-box-name-note"
            className="font-mono text-[13px]"
          />
          <p
            id="add-box-name-note"
            className={cn("text-[12px]", tried && nameError ? "text-risk" : "text-text-faint")}
          >
            {tried && nameError ? nameError : t.boxNameHint}
          </p>
        </div>

        <div className="grid gap-2">
          <label htmlFor="add-box-description" className="text-sm font-medium text-text">
            {t.description}
          </label>
          <Input
            id="add-box-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t.descriptionPlaceholder}
            aria-describedby="add-box-description-note"
          />
          <p id="add-box-description-note" className="text-[12px] text-text-faint">
            {t.descriptionHint}
          </p>
        </div>

        <fieldset className="grid gap-2">
          <legend className="mb-2 text-sm font-medium text-text">{t.page}</legend>
          {/* One choice per page, with the form's own page code beneath, so the
              reference can be checked against the printed sheet. */}
          <div
            role="radiogroup"
            aria-label={t.page}
            className="grid grid-cols-3 gap-2 sm:grid-cols-4"
          >
            {pages.map((p, i) => {
              const n = i + 1;
              const active = page === n;
              return (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setPage(n)}
                  className={cn(
                    "relative flex flex-col items-start rounded-lg border px-3 py-2 text-left transition-[background-color,border-color,transform] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.97]",
                    active
                      ? "border-brand-edge bg-brand-quiet"
                      : "border-border-strong bg-surface hover:border-brand-edge",
                  )}
                >
                  <span
                    className={cn("text-[13px] font-medium", active ? "text-brand" : "text-text")}
                    data-numeric
                  >
                    {fill(t.pageOption, { n })}
                  </span>
                  {p.footer && (
                    <span className="mt-0.5 max-w-full truncate text-[11px] text-text-faint" data-numeric>
                      {p.footer}
                    </span>
                  )}
                  {active && (
                    <Check aria-hidden className="absolute right-2 top-2 size-3.5 text-brand" />
                  )}
                </button>
              );
            })}
          </div>
          {tried && pageError && <p className="text-[12px] text-risk">{pageError}</p>}
        </fieldset>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t.cancel}
        </Button>
        <Button type="submit" variant="primary">
          {t.confirmAdd}
        </Button>
      </div>
    </form>
  );
}
