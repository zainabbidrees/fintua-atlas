"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { copy, fill } from "@/lib/copy";
import type { NewRow } from "./use-returns";

/** A return type the new schedule can belong to. */
export interface ReturnTypeChoice {
  id: string;
  name: string;
  /** The frequencies it already has a row for, so a duplicate is caught. */
  frequencies: string[];
}

/**
 * Adds a filing schedule the agent did not find. Every column is chosen from
 * the same fixed lists the in-place corrections use, so a typed value never
 * reaches Comply; only the rationale is written, and it is kept with the row
 * because nothing else says where the schedule comes from.
 */
export function AddRowDialog({
  open,
  onOpenChange,
  types,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  types: ReturnTypeChoice[];
  onAdd: (row: NewRow) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        {/* Radix unmounts on close, so each opening starts clean. */}
        {open && (
          <Body
            types={types}
            onCancel={() => onOpenChange(false)}
            onAdd={(row) => {
              onAdd(row);
              onOpenChange(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function Body({
  types,
  onCancel,
  onAdd,
}: {
  types: ReturnTypeChoice[];
  onCancel: () => void;
  onAdd: (row: NewRow) => void;
}) {
  const t = copy.returnsTable;
  /* With one return type there is nothing to choose between. */
  const [typeId, setTypeId] = React.useState(types.length === 1 ? types[0].id : "");
  const [frequency, setFrequency] = React.useState("");
  const [deadline, setDeadline] = React.useState("");
  const [nonWorkingDay, setNonWorkingDay] = React.useState<NewRow["nonWorkingDay"]>("next");
  const [dayCount, setDayCount] = React.useState<"calendar" | "working">("calendar");
  const [rationale, setRationale] = React.useState("");
  /* Errors show once the expert has tried to add, not while they choose. */
  const [tried, setTried] = React.useState(false);

  const type = types.find((x) => x.id === typeId);
  const taken = type !== undefined && frequency !== "" && type.frequencies.includes(frequency);
  const missing = !typeId || !frequency || !deadline;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setTried(true);
    if (missing || taken) return;
    onAdd({
      returnTypeId: typeId,
      frequency,
      deadline,
      nonWorkingDay,
      workdaysOnly: dayCount === "working",
      rationale: rationale.trim(),
    });
  }

  return (
    <form onSubmit={submit} noValidate>
      <DialogTitle>{t.addRowTitle}</DialogTitle>
      <DialogDescription>{t.addRowHint}</DialogDescription>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label={t.addRowReturnType} className="sm:col-span-2">
          <Select
            value={typeId}
            onChange={setTypeId}
            placeholder={t.chooseReturnType}
            invalid={tried && !typeId}
            options={types.map((x) => ({ value: x.id, label: x.name }))}
            autoFocus
          />
        </Field>

        <Field label={copy.returnsTable.columns.frequency}>
          <Select
            value={frequency}
            onChange={setFrequency}
            placeholder={t.chooseFrequency}
            invalid={tried && (!frequency || taken)}
            options={t.frequencies.map((f) => ({ value: f, label: f }))}
          />
        </Field>

        <Field label={copy.returnsTable.columns.deadline}>
          <Select
            value={deadline}
            onChange={setDeadline}
            placeholder={t.chooseDeadline}
            invalid={tried && !deadline}
            options={t.deadlines.map((d) => ({ value: d, label: d }))}
          />
        </Field>

        <Field label={copy.returnsTable.columns.nonWorkingDay}>
          <Select
            value={nonWorkingDay}
            onChange={(v) => setNonWorkingDay(v as NewRow["nonWorkingDay"])}
            options={(["next", "previous", "none"] as const).map((k) => ({
              value: k,
              label: t.nonWorkingDay[k],
            }))}
          />
        </Field>

        <Field label={t.addRowDayCount}>
          <Select
            value={dayCount}
            onChange={(v) => setDayCount(v as "calendar" | "working")}
            options={(["calendar", "working"] as const).map((k) => ({
              value: k,
              label: t.dayCount[k],
            }))}
          />
        </Field>

        <label className="grid gap-1.5 text-[12px] text-text-muted sm:col-span-2">
          <span>
            {t.editReasonLabel}{" "}
            <span className="text-text-faint">{t.editReasonOptional}</span>
          </span>
          <Textarea
            rows={2}
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            placeholder={t.addRowRationalePlaceholder}
            className="text-[13px]"
          />
        </label>
      </div>

      {tried && (missing || taken) && (
        <p className="mt-3 text-[12px] text-risk">
          {taken
            ? fill(t.addRowTaken, { name: type?.name ?? "", frequency })
            : t.addRowRequired}
        </p>
      )}

      <div className="mt-6 flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t.workflowCancel}
        </Button>
        <Button type="submit" variant="primary">
          {t.addRowConfirm}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("grid gap-1.5 text-[12px] text-text-muted", className)}>
      {label}
      {children}
    </label>
  );
}

/** The same native select the in-place corrections use, at form size. */
function Select({
  value,
  onChange,
  options,
  placeholder,
  invalid,
  autoFocus,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  invalid?: boolean;
  autoFocus?: boolean;
}) {
  return (
    <span className="relative block">
      <select
        value={value}
        autoFocus={autoFocus}
        aria-invalid={invalid || undefined}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-9 w-full appearance-none rounded-md border bg-surface pl-2.5 pr-7 text-[13px] text-text transition-colors focus:border-brand focus:outline-none",
          invalid ? "border-risk" : "border-border-strong",
          value === "" && "text-text-faint",
        )}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value} className="text-text">
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-text-faint"
      />
    </span>
  );
}
