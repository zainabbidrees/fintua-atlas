"use client";

import * as React from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * A plain expand/collapse. Used for anything that is supporting detail rather
 * than the main decision on the screen.
 */
export function Disclosure({
  summary,
  defaultOpen = false,
  children,
  className,
}: {
  summary: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = React.useState(defaultOpen);

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-1.5 rounded-md py-1 text-left text-sm font-medium text-text-muted transition-colors hover:text-text"
      >
        <ChevronRight
          className={cn(
            "size-4 shrink-0 transition-transform",
            open && "rotate-90",
          )}
        />
        {summary}
      </button>
      {open && <div className="pt-2">{children}</div>}
    </div>
  );
}
