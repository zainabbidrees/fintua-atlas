import * as React from "react";
import { cn } from "@/lib/cn";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-9 w-full rounded-md border border-border-strong bg-surface px-3 text-sm text-text",
      "placeholder:text-text-faint",
      "focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/25",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "aria-invalid:border-risk aria-invalid:ring-risk/20",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "w-full resize-none rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-text",
      "placeholder:text-text-faint",
      "focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/25",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
