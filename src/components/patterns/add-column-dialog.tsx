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
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { copy, fill } from "@/lib/copy";

/** What a column holds, when the sheet asks for it. */
export type ColumnType = keyof typeof copy.addColumn.types;

/** What the dialog hands back: the header, the value every row starts with,
 *  and — where `withType` is set — what the column holds. */
export interface NewColumn {
  name: string;
  value: string;
  type?: ColumnType;
}

/**
 * Adds a column to a sheet: its header, and optionally the value every
 * existing row takes in it. It lands at the end of the sheet, and the hint
 * says which column letter that is, so it can be found in the workbook. Used
 * by the spec sheets at step four and the tax-rule sheets at step five.
 */
export function AddColumnDialog({
  open,
  sheetName,
  columns,
  letter,
  notice,
  withType = false,
  onOpenChange,
  onAdd,
}: {
  open: boolean;
  /** Asks what the column holds, and requires it. */
  withType?: boolean;
  /** What else adding the column sets off, said before it is added. */
  notice?: string;
  /** The letter the new column lands at. */
  letter: string;
  /** The sheet's name as its tab reads, for the title. */
  sheetName: string;
  /** The sheet's headers as they stand, to refuse a duplicate. */
  columns: readonly string[];
  onOpenChange: (open: boolean) => void;
  onAdd: (column: NewColumn) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* Radix unmounts on close, so each opening starts clean. */}
        {open && (
          <Body
            sheetName={sheetName}
            columns={columns}
            letter={letter}
            notice={notice}
            withType={withType}
            onCancel={() => onOpenChange(false)}
            onAdd={(column) => {
              onAdd(column);
              onOpenChange(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function Body({
  sheetName,
  columns,
  letter,
  notice,
  withType,
  onCancel,
  onAdd,
}: {
  sheetName: string;
  columns: readonly string[];
  letter: string;
  notice?: string;
  withType: boolean;
  onCancel: () => void;
  onAdd: (column: NewColumn) => void;
}) {
  const t = copy.addColumn;
  const [name, setName] = React.useState("");
  const [value, setValue] = React.useState("");
  const [type, setType] = React.useState<ColumnType | "">("");
  /* Errors show once the expert has tried to add, not while they type. */
  const [tried, setTried] = React.useState(false);

  const trimmed = name.trim();
  const nameError = !trimmed
    ? t.nameRequired
    : columns.some((c) => c.toLowerCase() === trimmed.toLowerCase())
      ? fill(t.nameTaken, { name: trimmed })
      : null;
  const typeError = withType && type === "" ? t.typeRequired : null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setTried(true);
    if (nameError || typeError) return;
    onAdd({ name: trimmed, value: value.trim(), type: type || undefined });
  }

  return (
    <form onSubmit={submit} noValidate>
      <DialogTitle>{fill(t.title, { sheet: sheetName })}</DialogTitle>
      <DialogDescription>
        {fill(t.hint, { letter })}
      </DialogDescription>

      <div className="mt-5 space-y-5">
        <div className="grid gap-2">
          <label htmlFor="add-column-name" className="text-sm font-medium text-text">
            {t.name}
          </label>
          <Input
            id="add-column-name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.namePlaceholder}
            aria-invalid={tried && nameError ? true : undefined}
            aria-describedby="add-column-name-note"
          />
          <p
            id="add-column-name-note"
            className={cn("text-[12px]", tried && nameError ? "text-risk" : "text-text-faint")}
          >
            {tried && nameError ? nameError : t.nameHint}
          </p>
        </div>

        {withType && (
          <div className="grid gap-2">
            <label htmlFor="add-column-type" className="text-sm font-medium text-text">
              {t.type}
            </label>
            <span className="relative block">
              <select
                id="add-column-type"
                value={type}
                onChange={(e) => setType(e.target.value as ColumnType)}
                aria-invalid={tried && typeError ? true : undefined}
                aria-describedby="add-column-type-note"
                className={cn(
                  "h-9 w-full appearance-none rounded-md border bg-surface pl-3 pr-8 text-sm text-text transition-colors focus:border-brand focus:outline-none",
                  tried && typeError ? "border-risk" : "border-border-strong",
                  type === "" && "text-text-faint",
                )}
              >
                <option value="" disabled>
                  {t.chooseType}
                </option>
                {(Object.keys(t.types) as ColumnType[]).map((k) => (
                  <option key={k} value={k} className="text-text">
                    {t.types[k]}
                  </option>
                ))}
              </select>
              <ChevronDown
                aria-hidden
                className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-text-faint"
              />
            </span>
            <p
              id="add-column-type-note"
              className={cn("text-[12px]", tried && typeError ? "text-risk" : "text-text-faint")}
            >
              {tried && typeError ? typeError : t.typeHint}
            </p>
          </div>
        )}

        <div className="grid gap-2">
          <label htmlFor="add-column-value" className="text-sm font-medium text-text">
            {t.value}
          </label>
          <Input
            id="add-column-value"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={t.valuePlaceholder}
            aria-describedby="add-column-value-note"
          />
          <p id="add-column-value-note" className="text-[12px] text-text-faint">
            {t.valueHint}
          </p>
        </div>
      </div>

      {/* Said beside the button that sets it off, so it is read before, not
          learned after. */}
      {notice && (
        <p className="mt-5 rounded-md bg-surface-sunken px-3 py-2 text-[13px] leading-relaxed text-text-muted">
          {notice}
        </p>
      )}

      <div className="mt-6 flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t.cancel}
        </Button>
        <Button type="submit" variant="primary">
          {t.confirm}
        </Button>
      </div>
    </form>
  );
}
