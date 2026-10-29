"use client";

import * as React from "react";
import { Loader2, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * A slim bar that sits under a listing and offers two routes for the same typed
 * term: add it straight to the list, or run the search for it again. The same
 * single-line strip shape as the upload bar it stands in for, so the foot of the
 * step reads the same whichever route the listing takes.
 *
 * Vocabulary-free: every label is passed in, so it knows nothing about what is
 * being searched or added.
 */
export function SearchAddBar({
  className,
  placeholder,
  addLabel,
  searchLabel,
  onAdd,
  onSearch,
  busy = false,
  message,
  onDismissMessage,
}: {
  className?: string;
  placeholder: string;
  addLabel: string;
  searchLabel: string;
  onAdd: (term: string) => void;
  onSearch: (term: string) => void;
  /** A search is in flight — both routes wait, and the search button spins. */
  busy?: boolean;
  /** The outcome of the last search (nothing found, already in scope). */
  message?: string | null;
  onDismissMessage?: () => void;
}) {
  const [term, setTerm] = React.useState("");
  const value = term.trim();
  const disabled = !value || busy;

  function add() {
    if (disabled) return;
    onAdd(value);
    setTerm("");
  }

  function search() {
    if (disabled) return;
    onSearch(value);
    setTerm("");
  }

  return (
    <section className={className} aria-label={placeholder}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-border-strong bg-surface px-2.5 py-2">
        <div className="relative flex min-w-0 flex-1 items-center">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-2 size-4 text-text-muted"
          />
          <Input
            value={term}
            aria-label={placeholder}
            placeholder={placeholder}
            onChange={(e) => {
              setTerm(e.target.value);
              onDismissMessage?.();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                search();
              }
            }}
            className="h-8 border-0 bg-transparent pl-7 pr-2 text-[13px] shadow-none focus-visible:ring-0"
          />
        </div>

        <Button
          size="sm"
          variant="secondary"
          disabled={disabled}
          onClick={add}
          className="shrink-0"
        >
          <Plus />
          {addLabel}
        </Button>
        <Button
          size="sm"
          variant="primary"
          disabled={disabled}
          onClick={search}
          className="shrink-0"
        >
          {busy ? <Loader2 className="animate-spin" /> : <Search />}
          {searchLabel}
        </Button>
      </div>

      {message && (
        <p className="mt-1.5 text-[12px] text-text-muted">{message}</p>
      )}
    </section>
  );
}
