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
import type { Row } from "./use-spec-sheets";

/** A field-map box that takes its value from a closed list. */
export interface DropdownBox {
  name: string;
  description: string;
}

export interface DropdownValue {
  field_name: string;
  value: string;
  label: string;
  label_local_language: string;
}

/**
 * Adds an allowed value to a drop-down box: first the box it belongs to —
 * only boxes whose field_type is drop-down are offered — then the key stored
 * for the choice and the value shown for it. The box's existing values sit
 * beside the fields, so a key already in use is caught before it is added.
 */
export function AddDropdownDialog({
  open,
  boxes,
  values,
  onOpenChange,
  onAdd,
}: {
  open: boolean;
  boxes: DropdownBox[];
  /** The dropdown sheet as it stands, for each box's existing values. */
  values: Row[];
  onOpenChange: (open: boolean) => void;
  onAdd: (value: DropdownValue) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* Radix unmounts on close, so each opening starts clean. */}
        {open && (
          <Body
            boxes={boxes}
            values={values}
            onCancel={() => onOpenChange(false)}
            onAdd={(value) => {
              onAdd(value);
              onOpenChange(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function Body({
  boxes,
  values,
  onCancel,
  onAdd,
}: {
  boxes: DropdownBox[];
  values: Row[];
  onCancel: () => void;
  onAdd: (value: DropdownValue) => void;
}) {
  const t = copy.fieldMap;
  /* With a single drop-down box there is nothing to choose between. */
  const [box, setBox] = React.useState<string | null>(boxes.length === 1 ? boxes[0].name : null);
  const [key, setKey] = React.useState("");
  const [label, setLabel] = React.useState("");
  const [local, setLocal] = React.useState("");
  /* Errors show once the expert has tried to add, not while they type. */
  const [tried, setTried] = React.useState(false);

  const existing = values.filter((v) => v.field_name === box);
  const trimmedKey = key.trim();
  const boxError = box === null ? t.baseBoxRequired : null;
  const keyError = !trimmedKey
    ? t.keyRequired
    : existing.some((v) => (v.value ?? "").toLowerCase() === trimmedKey.toLowerCase())
      ? fill(t.keyTaken, { key: trimmedKey, box: box ?? "" })
      : null;
  const labelError = !label.trim() ? t.valueRequired : null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setTried(true);
    if (boxError || keyError || labelError || box === null) return;
    onAdd({
      field_name: box,
      value: trimmedKey,
      label: label.trim(),
      label_local_language: local.trim(),
    });
  }

  if (boxes.length === 0) {
    return (
      <div>
        <DialogTitle>{t.addValueTitle}</DialogTitle>
        <DialogDescription>{t.noDropdownBoxes}</DialogDescription>
        <p className="mt-3 text-sm leading-relaxed text-text-muted">{t.noDropdownBoxesHint}</p>
        <div className="mt-6 flex justify-end">
          <Button type="button" variant="secondary" onClick={onCancel}>
            {t.close}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <DialogTitle>{t.addValueTitle}</DialogTitle>
      <DialogDescription>{t.addValueHint}</DialogDescription>

      <div className="mt-5 space-y-5">
        <fieldset className="grid gap-2">
          <legend className="mb-2 text-sm font-medium text-text">{t.baseBox}</legend>
          <div role="radiogroup" aria-label={t.baseBox} className="grid gap-2">
            {boxes.map((b) => {
              const active = box === b.name;
              return (
                <button
                  key={b.name}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setBox(b.name)}
                  className={cn(
                    "relative flex flex-col items-start rounded-lg border px-3 py-2 pr-8 text-left transition-[background-color,border-color,transform] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.99]",
                    active
                      ? "border-brand-edge bg-surface-sunken"
                      : "border-border-strong bg-surface hover:border-brand-edge",
                  )}
                >
                  <span className={cn("font-mono text-[13px]", active ? "text-brand" : "text-text")}>
                    {b.name}
                  </span>
                  {b.description && (
                    <span className="mt-0.5 max-w-full truncate text-[12px] text-text-muted">
                      {b.description}
                    </span>
                  )}
                  {active && (
                    <Check aria-hidden className="absolute right-3 top-2.5 size-3.5 text-brand" />
                  )}
                </button>
              );
            })}
          </div>
          <p className={cn("text-[12px]", tried && boxError ? "text-risk" : "text-text-faint")}>
            {tried && boxError ? boxError : t.baseBoxHint}
          </p>
        </fieldset>

        {/* The key and value belong to a box, so they wait until one is picked. */}
        {box !== null && (
          <div className="rise space-y-5">
            {existing.length > 0 && (
              <p className="rounded-md bg-surface-sunken px-3 py-2 text-[12px] text-text-muted">
                {fill(t.existingValues, {
                  box,
                  values: existing.map((v) => `${v.value} ${v.label ?? ""}`.trim()).join(" · "),
                })}
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-[8rem_minmax(0,1fr)]">
              <div className="grid content-start gap-2">
                <label htmlFor="add-value-key" className="text-sm font-medium text-text">
                  {t.key}
                </label>
                <Input
                  id="add-value-key"
                  autoFocus
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder={t.keyPlaceholder}
                  aria-invalid={tried && keyError ? true : undefined}
                  aria-describedby="add-value-key-note"
                  className="font-mono text-[13px]"
                />
                <p
                  id="add-value-key-note"
                  className={cn("text-[12px]", tried && keyError ? "text-risk" : "text-text-faint")}
                >
                  {tried && keyError ? keyError : t.keyHint}
                </p>
              </div>

              <div className="grid content-start gap-2">
                <label htmlFor="add-value-label" className="text-sm font-medium text-text">
                  {t.value}
                </label>
                <Input
                  id="add-value-label"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder={t.valuePlaceholder}
                  aria-invalid={tried && labelError ? true : undefined}
                  aria-describedby="add-value-label-note"
                />
                <p
                  id="add-value-label-note"
                  className={cn("text-[12px]", tried && labelError ? "text-risk" : "text-text-faint")}
                >
                  {tried && labelError ? labelError : t.valueHint}
                </p>
              </div>
            </div>

            <div className="grid gap-2">
              <label htmlFor="add-value-local" className="text-sm font-medium text-text">
                {t.valueLocal}
              </label>
              <Input
                id="add-value-local"
                value={local}
                onChange={(e) => setLocal(e.target.value)}
                placeholder={t.valueLocalPlaceholder}
                aria-describedby="add-value-local-note"
              />
              <p id="add-value-local-note" className="text-[12px] text-text-faint">
                {t.valueLocalHint}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t.cancel}
        </Button>
        <Button type="submit" variant="primary">
          {t.confirmAddValue}
        </Button>
      </div>
    </form>
  );
}
