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
 * Every country, listed identically.
 *
 * Story 1.1 is explicit: countries already in Comply appear "with no difference
 * from other countries", and the list is not filtered by whether a country
 * already exists. The prototype greyed those out and disabled them — we follow
 * the written requirement, so nothing here marks a country as already onboarded.
 */
export function CountryPicker({
  value,
  placeholder,
  label,
  onSelect,
}: {
  value: Country | null;
  placeholder: string;
  label: string;
  onSelect: (country: Country) => void;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <div>
      <label className="text-sm font-medium text-text">{label}</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          className={cn(
            "mt-1.5 flex h-10 w-full max-w-sm items-center justify-between gap-2 rounded-md",
            "border border-border-strong bg-surface px-3 text-sm",
            "hover:bg-surface-sunken",
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
  onPick,
}: {
  selectedCode: string | null;
  placeholder: string;
  onPick: (country: Country) => void;
}) {
  const [term, setTerm] = React.useState("");
  const results = React.useMemo(() => searchCountries(term), [term]);

  return (
    <>
          <div className="flex items-center gap-2 border-b border-border px-3">
            <Search className="size-4 shrink-0 text-text-faint" />
            <Input
              autoFocus
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder={placeholder}
              className="h-10 border-0 px-0 focus-visible:ring-0"
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
                    "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm",
                    "hover:bg-surface-sunken",
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
