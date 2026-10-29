"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/cn";
import { copy } from "@/lib/copy";
import type { FormDoc } from "@/lib/mock/form-preview";
import type { FormEdition } from "@/lib/types";

/** One return type as this step sees it: its form, and how far it is annotated. */
export interface ReturnTypeForm {
  id: string;
  name: string;
  localName: string | null;
  /** The edition carried in from Tax Form Retrieval; null where none was found. */
  edition: FormEdition | null;
  /** The form with the agent's boxes drawn over it; null where it has not
      annotated one. */
  doc: FormDoc | null;
}

/**
 * Chooses which return type's form, annotations and field map the step shows.
 * A dropdown of names rather than a row of tabs, so it stays one line however
 * many return types a country carries; a long list scrolls inside the menu.
 * The designer chose the dropdown over a row of tabs (2026-10-29).
 */
export function ReturnTypePicker({
  types,
  value,
  onValueChange,
}: {
  types: ReturnTypeForm[];
  value: string;
  onValueChange: (id: string) => void;
}) {
  const t = copy.returnTypeSpecs;
  const current = types.find((type) => type.id === value);

  return (
    <div className="flex items-center gap-3">
      <span className="text-[13px] font-medium text-text-muted">{t.label}</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" className="min-w-56 justify-between">
            {current?.name}
            <ChevronDown className="text-text-faint" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="max-h-80 min-w-56 overflow-y-auto">
          {types.map((type) => {
            const active = type.id === value;
            return (
              <DropdownMenuItem key={type.id} onSelect={() => onValueChange(type.id)}>
                <span className={cn("flex-1", active && "font-medium")}>{type.name}</span>
                {active && <Check className="size-4 text-brand" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/** The content for the selected return type. */
export function ReturnTypePanel({ id, children }: { id: string; children: React.ReactNode }) {
  return <div data-return-type={id}>{children}</div>;
}
