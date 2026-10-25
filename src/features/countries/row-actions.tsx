"use client";

import * as React from "react";
import Link from "next/link";
import { MoreHorizontal, ArrowUpRight, Pencil, Copy, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { copy, fill } from "@/lib/copy";
import { cn } from "@/lib/cn";
import type { CountryRow } from "./data";

/**
 * The CRUD handle on a row: Open (read), Edit (update), Duplicate (create) and
 * Remove (delete). The row itself still opens on click; this is the explicit
 * way in, and the only way to the three actions that aren't navigation.
 *
 * The trigger is visible by default. Pass `quiet` to fade it in only on row
 * hover or focus, for places where a dense list shouldn't carry a control in
 * every row.
 */
export function RowActions({
  run,
  quiet = false,
  onEdit,
  onDuplicate,
  onRemove,
}: {
  run: CountryRow;
  quiet?: boolean;
  onEdit: (run: CountryRow) => void;
  onDuplicate: (run: CountryRow) => void;
  onRemove: (run: CountryRow) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          /* The row has its own click-to-open; keep it from firing here. */
          onClick={(e) => e.stopPropagation()}
          aria-label={fill(copy.countries.rowActions, { country: run.name })}
          className={cn(
            /* Same 32px rounded-lg as the row's code/flag badge, so the two
               ends of the row share one shape rather than a small boxed chip
               jammed against the far edge. */
            "grid size-8 place-items-center rounded-lg text-text-faint",
            "transition-[opacity,color,background-color] duration-200",
            "hover:bg-surface-sunken hover:text-text",
            "focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
            "data-[state=open]:bg-surface-sunken data-[state=open]:text-text data-[state=open]:opacity-100",
            quiet && "opacity-0 group-hover:opacity-100",
          )}
        >
          <MoreHorizontal className="size-4" />
        </button>
      </DropdownMenuTrigger>

      {/* Portaled, so it never bubbles into the row; the stop here covers the
          brief moment the content is mounted inline during close. */}
      <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem asChild>
          <Link href={`/countries/${run.code}/returns`}>
            <ArrowUpRight />
            {copy.countries.open}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onEdit(run)}>
          <Pencil />
          {copy.countries.edit}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onDuplicate(run)}>
          <Copy />
          {copy.countries.duplicate}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem destructive onSelect={() => onRemove(run)}>
          <Trash2 />
          {copy.countries.remove}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
