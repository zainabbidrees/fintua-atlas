"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { copy, fill } from "@/lib/copy";
import { WORKFLOW_STAGES, type WorkflowDays } from "./use-returns";

/**
 * The manual columns of a return-type row, entered as the timeline they
 * describe: data due → prepare → review → approve → submit → submission due,
 * with the number of days each stage takes. The offset is days, not dates,
 * so the form asks only for numbers.
 *
 * The same form sets whether this frequency is the return type's default, and
 * can hand the days on to every row still without any — most return types
 * share one rhythm, so one row filled can fill the rest.
 */
export function WorkflowDialog({
  open,
  onOpenChange,
  name,
  frequency,
  initial,
  isDefault,
  onlyFrequency,
  unsetOthers,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  frequency: string;
  /** The row's days, or a starting point taken from another row. */
  initial: WorkflowDays | null;
  isDefault: boolean;
  /** The return type has one frequency, so it is the default by definition. */
  onlyFrequency: boolean;
  /** Other rows still without days. */
  unsetOthers: number;
  onSave: (days: WorkflowDays, makeDefault: boolean, toUnset: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        {/* Radix unmounts on close, so each opening starts from `initial`. */}
        {open && (
          <Body
            name={name}
            frequency={frequency}
            initial={initial}
            isDefault={isDefault}
            onlyFrequency={onlyFrequency}
            unsetOthers={unsetOthers}
            onCancel={() => onOpenChange(false)}
            onSave={(...args) => {
              onSave(...args);
              onOpenChange(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function Body({
  name,
  frequency,
  initial,
  isDefault,
  onlyFrequency,
  unsetOthers,
  onCancel,
  onSave,
}: {
  name: string;
  frequency: string;
  initial: WorkflowDays | null;
  isDefault: boolean;
  onlyFrequency: boolean;
  unsetOthers: number;
  onCancel: () => void;
  onSave: (days: WorkflowDays, makeDefault: boolean, toUnset: boolean) => void;
}) {
  const t = copy.returnsTable;
  const [values, setValues] = React.useState<string[]>(
    initial ? initial.map(String) : ["", "", "", "", ""],
  );
  const [makeDefault, setMakeDefault] = React.useState(isDefault || onlyFrequency);
  const [toUnset, setToUnset] = React.useState(unsetOthers > 0);

  /* A stage left blank is zero days, so the form can be saved as it stands. */
  const days = values.map((v) => (/^\d+$/.test(v.trim()) ? Number(v) : 0)) as WorkflowDays;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onSave(days, makeDefault, toUnset);
  }

  return (
    <form onSubmit={submit} noValidate>
      <DialogTitle>{t.workflowTitle}</DialogTitle>
      <DialogDescription>
        <span className="font-medium text-text">{fill(t.workflowSubject, { name, frequency })}</span>
        <span className="mt-1 block">{t.workflowHint}</span>
      </DialogDescription>

      {/* The timeline: a stage, the days to the next, the next stage. */}
      <ol className="mt-5">
        {WORKFLOW_STAGES.map((stage, i) => {
          const last = i === WORKFLOW_STAGES.length - 1;
          return (
            <li key={stage} className="relative pl-6">
              {/* The line that runs between the stage dots. */}
              {!last && (
                <span aria-hidden className="absolute bottom-0 left-[5px] top-3 w-px bg-border-strong" />
              )}
              <span
                aria-hidden
                className={cn(
                  "absolute left-0 top-[5px] size-[11px] rounded-full border-2",
                  last ? "border-brand bg-brand" : "border-border-strong bg-surface",
                )}
              />
              <span className={cn("block text-[14px]", last ? "font-medium text-heading" : "text-text")}>
                {t.stages[stage]}
              </span>
              {!last && (
                <label className="flex items-center gap-2 py-2.5 text-[13px] text-text-muted">
                  <Input
                    inputMode="numeric"
                    value={values[i]}
                    onChange={(e) =>
                      setValues((v) => v.map((x, j) => (j === i ? toDigits(e.target.value) : x)))
                    }
                    aria-label={fill(t.daysBetween, {
                      from: t.stages[stage],
                      to: t.stages[WORKFLOW_STAGES[i + 1]],
                    })}
                    autoFocus={i === 0}
                    placeholder="0"
                    className="h-8 w-16 text-center"
                    data-numeric
                  />
                  {t.daysUnit}
                </label>
              )}
            </li>
          );
        })}
      </ol>

      <div className="mt-5 space-y-3 border-t border-border pt-4">
        {onlyFrequency ? (
          <p className="text-[13px] text-text-muted">{fill(t.onlyFrequency, { name })}</p>
        ) : (
          <label className="flex items-start gap-2.5 text-[14px] text-text">
            <Checkbox
              checked={makeDefault}
              onCheckedChange={(v) => setMakeDefault(v === true)}
              className="mt-0.5"
            />
            <span>
              {fill(t.defaultLabel, { name })}
              <span className="block text-[12px] text-text-faint">{t.defaultHint}</span>
            </span>
          </label>
        )}
        {unsetOthers > 0 && (
          <label className="flex items-start gap-2.5 text-[14px] text-text">
            <Checkbox
              checked={toUnset}
              onCheckedChange={(v) => setToUnset(v === true)}
              className="mt-0.5"
            />
            <span>
              {unsetOthers === 1
                ? t.applyToUnsetOne
                : fill(t.applyToUnset, { count: unsetOthers })}
            </span>
          </label>
        )}
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t.workflowCancel}
        </Button>
        <Button type="submit" variant="primary">
          {t.workflowSave}
        </Button>
      </div>
    </form>
  );
}

/* Where each script's digit zero sits: Latin, Arabic-Indic, Extended
   Arabic-Indic (Urdu, Persian), Devanagari, full-width. */
const DIGIT_ZEROS = [0x30, 0x660, 0x6f0, 0x966, 0xff10];

/** Keeps only digits, read as 0–9 whatever keyboard typed them — an Urdu
 *  layout's number row types ۵, not 5, and dropping it read as a dead field. */
function toDigits(value: string): string {
  let out = "";
  for (const ch of value) {
    const code = ch.codePointAt(0) ?? 0;
    const zero = DIGIT_ZEROS.find((z) => code >= z && code <= z + 9);
    if (zero !== undefined) out += String(code - zero);
  }
  return out;
}
