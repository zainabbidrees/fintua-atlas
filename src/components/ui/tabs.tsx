"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * A row of outlined pills. Each tab is its own bordered target, so it reads as
 * something to press; the selected one takes the stepper's own treatment — a
 * pale brand fill on a brand edge — so selection looks the same everywhere in
 * the app. No grey tray, no filled badges: the counts are quiet text, there to
 * say what is behind a tab before it is opened.
 *
 * Arrow keys move between tabs; the panel is the caller's, labelled back to its
 * tab. A row too wide for its container scrolls rather than wraps.
 */
export function Tabs({
  tabs,
  value,
  onValueChange,
  idBase,
  className,
}: {
  tabs: { id: string; label: string; count?: number }[];
  value: string;
  onValueChange: (id: string) => void;
  /** Namespaces the tab/panel ids so `aria-controls` is unique on the page. */
  idBase: string;
  className?: string;
}) {
  const refs = React.useRef<Record<string, HTMLButtonElement | null>>({});

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const i = tabs.findIndex((t) => t.id === value);
    const dir = e.key === "ArrowRight" ? 1 : -1;
    const next = tabs[(i + dir + tabs.length) % tabs.length];
    onValueChange(next.id);
    refs.current[next.id]?.focus();
  }

  return (
    <div
      role="tablist"
      onKeyDown={onKeyDown}
      className={cn(
        "flex w-max max-w-full gap-2 overflow-x-auto",
        "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {tabs.map((t) => {
        const active = t.id === value;
        return (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[t.id] = el;
            }}
            role="tab"
            type="button"
            id={`${idBase}-tab-${t.id}`}
            aria-controls={`${idBase}-panel-${t.id}`}
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onValueChange(t.id)}
            className={cn(
              "inline-flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-4 text-[13px] font-medium",
              "transition-[background-color,border-color,color,transform] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
              /* Tactile: the tab gives under the press. */
              "active:scale-[0.97] motion-reduce:active:scale-100",
              active
                ? "border-brand-edge bg-brand-quiet text-brand"
                : "cursor-pointer border-border-strong bg-surface text-text-muted hover:border-brand-edge hover:text-text",
            )}
          >
            {t.label}
            {t.count !== undefined && (
              <span
                data-numeric
                className={cn(
                  "text-[12px] font-normal transition-colors",
                  active ? "text-brand/70" : "text-text-faint",
                )}
              >
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** The panel for a tab — rendered by the caller, wired back to its tab. */
export function TabPanel({
  id,
  idBase,
  className,
  children,
}: {
  id: string;
  idBase: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role="tabpanel"
      id={`${idBase}-panel-${id}`}
      aria-labelledby={`${idBase}-tab-${id}`}
      tabIndex={0}
      className={cn("focus-visible:outline-none", className)}
    >
      {children}
    </div>
  );
}
