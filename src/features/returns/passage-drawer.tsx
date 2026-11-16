"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ArrowUpRight, FileText, MoreHorizontal, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { copy } from "@/lib/copy";
import type { PassageSection } from "./passage-sections";

/**
 * The source evidence behind a return type, read as precise citations.
 *
 * A row's facts come from different sentences, sometimes different documents —
 * one for how often it is filed, one for its deadline, one for where that
 * deadline moves on a non-working day. The drawer gives each its own section:
 * a heading for what it establishes, the source it is drawn from, and the
 * verbatim wording the finding rests on, so every fact is checked against its
 * own quote. The fuller passage sits behind a quiet control, per section, and
 * opens only on request with the quote highlighted in place.
 */
export function PassageDrawer({
  title,
  subtitle,
  sections,
  open,
  onOpenChange,
}: {
  /** The return type the evidence belongs to. */
  title: string;
  /** Its local-language name, when there is one. */
  subtitle?: string;
  sections: PassageSection[];
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
          {/* Header: the return type the evidence below is for. Each section
              carries its own source, so the header names the row, not a doc. */}
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-6 py-4">
            <div className="min-w-0">
              <DialogPrimitive.Title className="text-[15px] font-medium text-heading">
                {title}
              </DialogPrimitive.Title>
              {subtitle && <p className="mt-0.5 text-[13px] text-text-muted">{subtitle}</p>}
            </div>

            <DialogPrimitive.Close
              aria-label="Close"
              className="-mr-1 grid size-8 shrink-0 place-items-center rounded-md text-text-faint transition-colors hover:bg-wash hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
            >
              <X className="size-4" />
            </DialogPrimitive.Close>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
            <div className="space-y-7">
              {sections.map((section) => (
                <Section key={section.key} section={section} />
              ))}
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/**
 * One section: what the quote establishes, the source it is drawn from, the
 * verbatim wording, and — when a surrounding passage was captured — a quiet
 * control that opens it with the quote highlighted.
 */
function Section({ section }: { section: PassageSection }) {
  const { label, quote, evidence } = section;
  const [showContext, setShowContext] = React.useState(false);

  return (
    <section>
      {/* What this wording establishes — frequency, deadline, non-working days. */}
      <h3 className="text-[13px] font-semibold text-heading">{label}</h3>

      {/* The source as a real link, with its publisher and exact locator. */}
      <a
        href={evidence.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group mt-1.5 inline-flex items-start gap-1.5 text-[13px] font-medium text-brand transition-colors hover:text-brand-hover"
      >
        <FileText className="mt-0.5 size-3.5 shrink-0" strokeWidth={1.75} />
        <span className="underline decoration-brand/40 underline-offset-2 group-hover:decoration-brand">
          {evidence.sourceTitle}
        </span>
        <ArrowUpRight className="mt-0.5 size-3 shrink-0" />
      </a>
      <p className="mt-0.5 text-[12px] text-text-muted">
        {evidence.publisher}
        {evidence.locator ? ` · ${evidence.locator}` : ""}
      </p>

      {/* The words cited, verbatim — the precise evidence, always shown. */}
      <figure className="mt-3 border-l-2 border-brand-edge bg-brand-quiet/50 py-3 pl-4 pr-3">
        <figcaption className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-faint">
          {copy.sources.exactQuoteLabel}
        </figcaption>
        <blockquote className="mt-1.5 text-[15px] font-medium leading-relaxed text-text">
          {quote}
        </blockquote>
      </figure>

      {/* The fuller passage, when captured, waits behind a quiet dots control. */}
      {evidence.article && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowContext((v) => !v)}
            aria-expanded={showContext}
            className="inline-flex items-center gap-2 rounded-md text-[13px] font-medium text-text-muted transition-colors hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
          >
            <MoreHorizontal className="size-4 text-text-faint" strokeWidth={2} />
            {showContext ? copy.sources.hideContext : copy.sources.showContext}
          </button>

          {showContext && (
            <div className="mt-3 max-w-[58ch] space-y-4 border-t border-border pt-4 text-[14px] leading-relaxed text-text-muted">
              {evidence.article.split("\n\n").map((p, i) => (
                <p key={i}>{highlight(p, quote)}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/** Wraps `quote` in a highlight where it appears in the paragraph. */
function highlight(paragraph: string, quote: string) {
  const at = paragraph.indexOf(quote);
  if (at === -1) return paragraph;
  return (
    <>
      {paragraph.slice(0, at)}
      <mark className="rounded bg-brand-quiet px-1 py-0.5 font-medium text-text ring-1 ring-inset ring-brand-edge [box-decoration-break:clone] [-webkit-box-decoration-break:clone]">
        {quote}
      </mark>
      {paragraph.slice(at + quote.length)}
    </>
  );
}
