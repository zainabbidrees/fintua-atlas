"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ArrowUpRight, FileText, X } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Evidence } from "@/lib/types";

/**
 * The source passage, read in its context.
 *
 * Opening it slides a panel in from the right over a dimmed page, shows the
 * surrounding article, and scrolls down to the exact wording the finding rests
 * on — highlighted — so the expert sees the sentence and the paragraphs around
 * it rather than a quote lifted out of the document.
 */
export function PassageDrawer({
  evidence,
  open,
  onOpenChange,
}: {
  evidence: Evidence;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          data-slot="drawer-overlay"
          className={cn(
            "fixed inset-0 z-50 bg-text/25 backdrop-blur-[1px]",
            "data-[state=open]:[animation:overlay-in_240ms_ease]",
            "data-[state=closed]:[animation:overlay-out_180ms_ease]",
          )}
        />
        <DialogPrimitive.Content
          data-slot="drawer"
          aria-describedby={undefined}
          className={cn(
            "fixed inset-y-0 right-0 z-50 flex w-[min(34rem,calc(100vw-1.5rem))] flex-col",
            "border-l border-border bg-surface shadow-[var(--shadow-overlay)] focus:outline-none",
            "data-[state=open]:[animation:drawer-in_320ms_cubic-bezier(0.16,1,0.3,1)]",
            "data-[state=closed]:[animation:drawer-out_220ms_cubic-bezier(0.3,0,0.8,0.15)]",
          )}
        >
          {/* Header: the source as a real link, its publisher and locator. */}
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-6 py-4">
            <div className="min-w-0">
              <DialogPrimitive.Title asChild>
                <a
                  href={evidence.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-start gap-1.5 text-[15px] font-medium text-brand transition-colors hover:text-brand-hover"
                >
                  <FileText className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} />
                  <span className="underline decoration-brand/40 underline-offset-2 group-hover:decoration-brand">
                    {evidence.sourceTitle}
                  </span>
                  <ArrowUpRight className="mt-0.5 size-3.5 shrink-0" />
                </a>
              </DialogPrimitive.Title>
              <p className="mt-1 text-[13px] text-text-muted">
                {evidence.publisher}
                {evidence.locator ? ` · ${evidence.locator}` : ""}
              </p>
            </div>

            <DialogPrimitive.Close
              aria-label="Close"
              className="-mr-1 grid size-8 shrink-0 place-items-center rounded-md text-text-faint transition-colors hover:bg-wash hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
            >
              <X className="size-4" />
            </DialogPrimitive.Close>
          </div>

          <Article evidence={evidence} open={open} />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/** The article body: paragraphs with the quote highlighted, scrolled into view. */
function Article({ evidence, open }: { evidence: Evidence; open: boolean }) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const markRef = React.useRef<HTMLElement>(null);
  const body = evidence.article ?? evidence.quote;
  const paragraphs = body.split("\n\n");

  /* Let the panel settle, then scroll the highlight to the middle — so the
     reader sees the top of the document first and is carried down to it. */
  React.useEffect(() => {
    if (!open) return;
    const mark = markRef.current;
    const scroller = scrollRef.current;
    if (!mark || !scroller) return;
    scroller.scrollTop = 0;
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const t = window.setTimeout(() => {
      mark.scrollIntoView({
        behavior: prefersReduced ? "auto" : "smooth",
        block: "center",
      });
    }, prefersReduced ? 0 : 420);
    return () => window.clearTimeout(t);
  }, [open]);

  return (
    <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
      <div className="max-w-[58ch] space-y-4 text-[14px] leading-relaxed text-text-muted">
        {paragraphs.map((p, i) => (
          <p key={i}>{highlight(p, evidence.quote, markRef)}</p>
        ))}
      </div>
    </div>
  );
}

/** Wraps `quote` in a highlight where it appears in the paragraph. */
function highlight(
  paragraph: string,
  quote: string,
  markRef: React.RefObject<HTMLElement | null>,
) {
  const at = paragraph.indexOf(quote);
  if (at === -1) return paragraph;
  return (
    <>
      {paragraph.slice(0, at)}
      <mark
        ref={markRef}
        className="rounded bg-brand-quiet px-1 py-0.5 font-medium text-text ring-1 ring-inset ring-brand-edge [box-decoration-break:clone] [-webkit-box-decoration-break:clone]"
      >
        {quote}
      </mark>
      {paragraph.slice(at + quote.length)}
    </>
  );
}
