"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * A square, deliberate control — this is an inclusion decision, not a toggle.
 * Unchecked reads as a plain outline rather than a dimmed state, so "not
 * carried forward" never looks like "disabled".
 */
export const Checkbox = React.forwardRef<
  React.ComponentRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(function Checkbox({ className, ...props }, ref) {
  return (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(
        "peer flex size-[18px] shrink-0 items-center justify-center rounded-[5px] border border-border-strong bg-surface transition-colors",
        "hover:border-brand",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-1 focus-visible:ring-offset-surface",
        "data-[state=checked]:border-brand data-[state=checked]:bg-brand data-[state=checked]:text-on-brand",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center">
        <Check className="size-3 stroke-[3]" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
});
