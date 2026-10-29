"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { copy, fill } from "@/lib/copy";
import type { ReviewEntry } from "@/lib/review";

/** "29 Oct, 14:05" — when a comment or decision was made. */
export function when(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * One step's thread: every comment and decision, oldest first, with who made
 * it and when — then a box to add to it. Both roles comment; the decisions
 * (approve, ask for changes, send again) land here too, so the thread is the
 * whole story of the step's review.
 */
export function CommentsDrawer({
  open,
  onOpenChange,
  stepName,
  entries,
  onPost,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stepName: string;
  entries: ReviewEntry[];
  onPost: (text: string) => void;
}) {
  const t = copy.approvalFlow;
  const [draft, setDraft] = React.useState("");
  const endRef = React.useRef<HTMLLIElement>(null);

  /* Land on the latest entry, and follow new ones as they arrive. */
  React.useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ block: "end" });
  }, [open, entries.length]);

  function post(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    onPost(text);
    setDraft("");
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-text/25 backdrop-blur-[1px]",
            "data-[state=open]:[animation:overlay-in_240ms_ease]",
            "data-[state=closed]:[animation:overlay-out_180ms_ease]",
          )}
        />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={cn(
            "fixed inset-y-0 right-0 z-50 flex w-[min(30rem,calc(100vw-1.5rem))] flex-col",
            "border-l border-border bg-surface shadow-[var(--shadow-overlay)] focus:outline-none",
            "data-[state=open]:[animation:drawer-in_320ms_cubic-bezier(0.16,1,0.3,1)]",
            "data-[state=closed]:[animation:drawer-out_220ms_cubic-bezier(0.3,0,0.8,0.15)]",
          )}
        >
          <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border px-6 py-4">
            <DialogPrimitive.Title className="text-[15px] font-medium text-heading">
              {fill(t.drawerTitle, { step: stepName })}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              aria-label={t.close}
              className="-mr-1 grid size-8 shrink-0 place-items-center rounded-md text-text-faint transition-colors hover:bg-wash hover:text-text"
            >
              <X className="size-4" />
            </DialogPrimitive.Close>
          </div>

          <ol className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
            {entries.length === 0 && (
              <li className="text-[14px] text-text-muted">{t.emptyThread}</li>
            )}
            {entries.map((e) => (
              <Entry key={e.id} entry={e} />
            ))}
            <li ref={endRef} aria-hidden />
          </ol>

          <form onSubmit={post} className="shrink-0 border-t border-border px-6 py-4">
            <Textarea
              value={draft}
              rows={3}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) post(e);
              }}
              placeholder={t.commentPlaceholder}
              aria-label={t.commentPlaceholder}
            />
            <div className="mt-2 flex justify-end">
              <Button type="submit" variant="primary" size="sm" disabled={!draft.trim()}>
                {t.post}
              </Button>
            </div>
          </form>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function Entry({ entry: e }: { entry: ReviewEntry }) {
  const t = copy.approvalFlow;
  const initials = e.author
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);
  const decision = e.kind !== "comment";

  return (
    <li className="flex gap-3">
      <span
        aria-hidden
        className={cn(
          "grid size-7 shrink-0 place-items-center rounded-full text-[11px] font-semibold",
          e.role === "reviewer" ? "bg-surface-sunken text-text" : "bg-brand text-on-brand",
        )}
      >
        {initials}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px]">
          <span className="font-medium text-text">{e.author}</span>
          <span className="text-text-faint"> · {copy.approvalFlow.roles[e.role]}</span>
          {decision && (
            <span
              className={cn(
                "font-medium",
                e.kind === "approved" && "text-settled",
                e.kind === "changes" && "text-attention-text",
                e.kind === "resubmitted" && "text-text-muted",
              )}
            >
              {" "}
              {t.entryKind[e.kind]}
            </span>
          )}
        </p>
        {e.text && (
          <p className="mt-1 whitespace-pre-wrap text-[14px] leading-relaxed text-text">{e.text}</p>
        )}
        <p className="mt-1 text-[12px] text-text-faint">{when(e.at)}</p>
      </div>
    </li>
  );
}
