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
import { cn } from "@/lib/cn";
import { copy, fill } from "@/lib/copy";
import { columnLetter } from "./rule-sheet";

/**
 * Adds a column to a sales or purchase sheet: its header, and optionally the
 * value every existing rule takes in it. It lands at the end of the sheet,
 * and the hint says which column letter that is, so it can be found in the
 * workbook.
 */
export function AddColumnDialog({
  open,
  sheetName,
  columns,
  onOpenChange,
  onAdd,
}: {
  open: boolean;
  /** The sheet's name as its tab reads, for the title. */
  sheetName: string;
  /** The sheet's headers as they stand, to refuse a duplicate. */
  columns: readonly string[];
  onOpenChange: (open: boolean) => void;
  onAdd: (column: { name: string; value: string }) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* Radix unmounts on close, so each opening starts clean. */}
        {open && (
          <Body
            sheetName={sheetName}
            columns={columns}
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
  onCancel,
  onAdd,
}: {
  sheetName: string;
  columns: readonly string[];
  onCancel: () => void;
  onAdd: (column: { name: string; value: string }) => void;
}) {
  const t = copy.taxRules;
  const [name, setName] = React.useState("");
  const [value, setValue] = React.useState("");
  /* Errors show once the expert has tried to add, not while they type. */
  const [tried, setTried] = React.useState(false);

  const trimmed = name.trim();
  const nameError = !trimmed
    ? t.columnNameRequired
    : columns.some((c) => c.toLowerCase() === trimmed.toLowerCase())
      ? fill(t.columnNameTaken, { name: trimmed })
      : null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setTried(true);
    if (nameError) return;
    onAdd({ name: trimmed, value: value.trim() });
  }

  return (
    <form onSubmit={submit} noValidate>
      <DialogTitle>{fill(t.addColumnTitle, { sheet: sheetName })}</DialogTitle>
      <DialogDescription>
        {fill(t.addColumnHint, { letter: columnLetter(columns.length) })}
      </DialogDescription>

      <div className="mt-5 space-y-5">
        <div className="grid gap-2">
          <label htmlFor="add-column-name" className="text-sm font-medium text-text">
            {t.columnName}
          </label>
          <Input
            id="add-column-name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.columnNamePlaceholder}
            aria-invalid={tried && nameError ? true : undefined}
            aria-describedby="add-column-name-note"
          />
          <p
            id="add-column-name-note"
            className={cn("text-[12px]", tried && nameError ? "text-risk" : "text-text-faint")}
          >
            {tried && nameError ? nameError : t.columnNameHint}
          </p>
        </div>

        <div className="grid gap-2">
          <label htmlFor="add-column-value" className="text-sm font-medium text-text">
            {t.columnValue}
          </label>
          <Input
            id="add-column-value"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={t.columnValuePlaceholder}
            aria-describedby="add-column-value-note"
          />
          <p id="add-column-value-note" className="text-[12px] text-text-faint">
            {t.columnValueHint}
          </p>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t.cancel}
        </Button>
        <Button type="submit" variant="primary">
          {t.confirmAddColumn}
        </Button>
      </div>
    </form>
  );
}
