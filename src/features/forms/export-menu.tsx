"use client";

import * as React from "react";
import { ChevronDown, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { copy, fill } from "@/lib/copy";

export interface ExportChoice {
  /** null for every form at once. */
  obligationId: string | null;
  label: string;
  count: number;
}

/**
 * Export the ticked pages as a PDF — of every form together, or of one.
 *
 * Only ticked pages go into the file, so the export is exactly what carries
 * into the specs. A form with nothing ticked is not offered.
 */
export function ExportMenu({
  all,
  perForm,
  onExport,
}: {
  all: number;
  perForm: ExportChoice[];
  onExport: (obligationId: string | null) => void;
}) {
  const t = copy.taxForms;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="sm" disabled={all === 0}>
          <Download />
          {t.export}
          <ChevronDown className="text-text-faint" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-[17rem]">
        <DropdownMenuItem onSelect={() => onExport(null)}>
          <span className="flex-1 font-medium">{t.exportAll}</span>
          <Count n={all} />
        </DropdownMenuItem>
        {perForm.length > 0 && <DropdownMenuSeparator />}
        {perForm.map((choice) => (
          <DropdownMenuItem key={choice.obligationId} onSelect={() => onExport(choice.obligationId)}>
            <span className="flex-1">{fill(t.exportForm, { name: choice.label })}</span>
            <Count n={choice.count} />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Count({ n }: { n: number }) {
  return (
    <span className="text-[12px] text-text-faint" data-numeric>
      {fill(copy.taxForms.exportCount, { count: n })}
    </span>
  );
}
