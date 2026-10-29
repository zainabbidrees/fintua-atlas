"use client";

import * as React from "react";
import { Link2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * A short list of web addresses, entered one per row.
 *
 * Starts with a single field; the plus adds another beneath it, and any row
 * past the first can be removed. Nothing is sent until the submit button —
 * each row is checked then, and a bad one is named in place rather than
 * dropping the good ones.
 */
type Row = { id: number; value: string; error: boolean };

export function UrlList({
  heading,
  placeholder,
  addLabel,
  removeLabel,
  invalidMessage,
  submitLabel,
  onSubmit,
  className,
}: {
  heading: string;
  placeholder: string;
  addLabel: string;
  removeLabel: string;
  invalidMessage: string;
  submitLabel: string;
  onSubmit: (urls: string[]) => void;
  className?: string;
}) {
  const nextId = React.useRef(1);
  const [rows, setRows] = React.useState<Row[]>([{ id: 0, value: "", error: false }]);
  /** The row just added, focused once its input mounts. */
  const focusId = React.useRef<number | null>(null);

  function addRow() {
    const id = nextId.current++;
    setRows((r) => [...r, { id, value: "", error: false }]);
    focusId.current = id;
  }

  function update(id: number, value: string) {
    setRows((r) => r.map((row) => (row.id === id ? { ...row, value, error: false } : row)));
  }

  function remove(id: number) {
    setRows((r) => r.filter((row) => row.id !== id));
  }

  function parse(value: string): string | null {
    try {
      const url = new URL(value.trim());
      return /^https?:$/.test(url.protocol) ? url.toString() : null;
    } catch {
      return null;
    }
  }

  function submit() {
    const filled = rows.filter((row) => row.value.trim());
    const checked = rows.map((row) =>
      row.value.trim() ? { ...row, error: parse(row.value) === null } : row,
    );
    setRows(checked);
    if (filled.length === 0 || checked.some((row) => row.error)) return;
    onSubmit(filled.map((row) => parse(row.value) as string));
  }

  const hasValue = rows.some((row) => row.value.trim());

  return (
    <div className={className}>
      <p className="text-sm font-medium text-heading">{heading}</p>

      <ul className="mt-3 space-y-2">
        {rows.map((row, i) => (
          <li key={row.id}>
            <div className="flex items-center gap-2">
              <div className="relative min-w-0 flex-1">
                <Link2
                  aria-hidden
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted"
                />
                <Input
                  ref={(el) => {
                    if (!el) return;
                    if (focusId.current === row.id) {
                      el.focus();
                      focusId.current = null;
                    }
                  }}
                  type="url"
                  inputMode="url"
                  value={row.value}
                  aria-label={heading}
                  aria-invalid={row.error || undefined}
                  placeholder={placeholder}
                  onChange={(e) => update(row.id, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      submit();
                    }
                  }}
                  className="h-10 pl-9"
                />
              </div>
              {i > 0 && (
                <button
                  type="button"
                  onClick={() => remove(row.id)}
                  aria-label={removeLabel}
                  className="grid size-10 shrink-0 place-items-center rounded-md text-text-faint transition-colors hover:bg-wash hover:text-text"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
            {row.error && <p className="mt-1 text-[12px] text-risk">{invalidMessage}</p>}
          </li>
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" onClick={addRow}>
          <Plus />
          {addLabel}
        </Button>
        <Button
          variant="secondary"
          className="ml-auto"
          disabled={!hasValue}
          onClick={submit}
        >
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
