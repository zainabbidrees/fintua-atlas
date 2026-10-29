"use client";

import * as React from "react";
import { ChevronDown, Search } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { searchCountries } from "@/lib/mock/countries";
import type { Country } from "@/lib/types";
import { cn } from "@/lib/cn";

/**
 * Every country that has not been onboarded yet.
 *
 * Story 1.1 asked for already-onboarded countries to appear "with no
 * difference from other countries". The designer reversed that (deviation D1,
 * 2026-10-28), and then asked that they not appear at all (2026-10-29): a
 * country already on the Countries page — in progress, in review or
 * published — is left out, so it is never started twice. It is found on the
 * Countries page instead.
 */
export function CountryPicker({
  value,
  placeholder,
  label,
  onSelect,
  exclude = new Set(),
}: {
  value: Country | null;
  placeholder: string;
  label: string;
  onSelect: (country: Country) => void;
  /** Codes left out of the list: countries already onboarded. */
  exclude?: ReadonlySet<string>;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <div>
      <label className="text-sm font-medium text-text">{label}</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          className={cn(
            "mt-1.5 flex h-10 w-full items-center justify-between gap-2 rounded-md",
            "border border-border-strong bg-surface px-3 text-sm",
            "hover:bg-wash",
            "focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/25",
          )}
        >
          {value ? (
            <span className="flex items-center gap-2 text-text">
              <span aria-hidden className="text-base leading-none">
                {value.flag}
              </span>
              {value.name}
            </span>
          ) : (
            <span className="text-text-faint">{placeholder}</span>
          )}
          <ChevronDown className="size-4 shrink-0 text-text-faint" />
        </PopoverTrigger>

        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
          {/* Unmounted on close, so the query resets without an effect. */}
          <Results
            selectedCode={value?.code ?? null}
            placeholder={placeholder}
            exclude={exclude}
            onPick={(country) => {
              onSelect(country);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

function Results({
  selectedCode,
  placeholder,
  exclude,
  onPick,
}: {
  selectedCode: string | null;
  placeholder: string;
  exclude: ReadonlySet<string>;
  onPick: (country: Country) => void;
}) {
  const [term, setTerm] = React.useState("");
  const results = React.useMemo(
    () => searchCountries(term).filter((c) => !exclude.has(c.code)),
    [term, exclude],
  );

  return (
    <>
          <div className="flex items-center gap-2.5 border-b border-border px-3.5">
            <Search className="size-[18px] shrink-0 text-text-muted" />
            <Input
              autoFocus
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder={placeholder}
              className="h-12 border-0 px-0 text-[15px] focus-visible:ring-0"
            />
          </div>

          <ul className="max-h-64 overflow-y-auto p-1" role="listbox">
            {results.map((country) => (
              <li key={country.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selectedCode === country.code}
                  onClick={() => onPick(country)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-wash",
                    selectedCode === country.code && "bg-brand-quiet text-brand",
                  )}
                >
                  <span aria-hidden className="text-base leading-none">
                    {country.flag}
                  </span>
                  {country.name}
                </button>
              </li>
            ))}
            {results.length === 0 && (
              <li className="px-3 py-6 text-center text-sm text-text-faint">
                No match
              </li>
            )}
          </ul>
    </>
  );
}
