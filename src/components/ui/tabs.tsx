"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * A minimal tab list. Selection is the brand's job — that is what brand marks —
 * so the active tab carries a brand underline and the rest stay muted. Arrow
 * keys move between tabs; the panel is the caller's, labelled back to its tab.
 */
export function Tabs({
  tabs,
  value,
  onValueChange,
  idBase,
  className,
}: {
  tabs: { id: string; label: string }[];
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
      className={cn("flex gap-5 border-b border-border", className)}
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
              "-mb-px border-b-2 pb-2.5 text-[13px] font-medium transition-colors",
              active
                ? "border-brand text-brand"
                : "border-transparent text-text-muted hover:text-text",
            )}
          >
            {t.label}
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
