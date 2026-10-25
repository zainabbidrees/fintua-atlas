"use client";

import * as React from "react";
import { ArrowDown } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * A top-of-list shortcut to the items still blocking the step.
 *
 * Every step here gates the next on a handful of items that need a human, and
 * those items can sit far down a long list — so the expert ends up scrolling to
 * find what is holding them up. Rather than reorder the list under them (which
 * moves rows as they are resolved, and fights the order the data is meant to be
 * read in), this pins a count at the top that jumps to them.
 *
 * Each click steps to the NEXT item and wraps around, so when several are
 * outstanding one button walks through all of them rather than always landing
 * on the first. It reads the live set of `[data-review-item]` elements on every
 * click, so items resolved in between simply drop out of the rotation. Only one
 * blocking list is mounted per screen, so the plain selector is unambiguous.
 */
export function JumpToReview({
  count,
  /** The verb for the action, e.g. "review" or "settle". */
  verb,
  className,
}: {
  count: number;
  verb: string;
  className?: string;
}) {
  const cursor = React.useRef(0);

  if (count <= 0) return null;

  const multiple = count > 1;

  return (
    <button
      type="button"
      aria-label={
        multiple
          ? `Jump to the next of ${count} items to ${verb}`
          : `Jump to the item to ${verb}`
      }
      onClick={() => {
        const items = Array.from(
          document.querySelectorAll<HTMLElement>("[data-review-item]"),
        );
        if (items.length === 0) return;
        const i = cursor.current % items.length;
        cursor.current = i + 1;
        const reduce = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        items[i].scrollIntoView({
          behavior: reduce ? "auto" : "smooth",
          block: "center",
        });
      }}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-attention-edge bg-attention-quiet px-2.5 py-1 text-[13px] font-medium text-attention-text transition-colors hover:border-attention/50 active:scale-[0.98]",
        className,
      )}
    >
      <span className="tabular-nums">{count}</span> to {verb}
      {/* "Next" when there is more than one, so the cycling reads as intended. */}
      {multiple && <span className="text-attention-text/70">· next</span>}
      <ArrowDown className="size-3.5" />
    </button>
  );
}
