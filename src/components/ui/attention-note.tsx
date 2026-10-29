import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * The amber note that says, in plain words, why something needs a person.
 *
 * The note carries the flag; whatever holds it stays a plain surface with only
 * an amber edge. One amber block per flagged item, not a tinted row, so the
 * reason is what the eye lands on.
 */
export function AttentionNote({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "max-w-[62ch] rounded-md bg-attention-quiet px-3 py-2 text-sm leading-relaxed text-attention-text",
        className,
      )}
      {...props}
    />
  );
}
