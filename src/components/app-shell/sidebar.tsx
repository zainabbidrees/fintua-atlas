import { Suspense } from "react";
import { Wordmark } from "@/components/brand/logo";
import { ActiveNav } from "./active-nav";
import { NavList } from "./nav-list";

/**
 * Pinned to the viewport: `sticky` plus `self-start` and an explicit height,
 * because a flex child stretches to the container by default and then has no
 * room left to stick. Long runs scroll past it.
 */
export function Sidebar() {
  return (
    <nav className="sticky top-0 hidden h-[100dvh] w-72 shrink-0 flex-col self-start bg-deep px-5 py-7 md:flex">
      <div className="px-2">
        <Wordmark tone="on-deep" />
      </div>

      {/* Same markup in the fallback, minus the highlight, so nothing shifts. */}
      <Suspense fallback={<NavList activePath={null} />}>
        <ActiveNav />
      </Suspense>

      <div className="mt-auto flex items-center gap-3 rounded-lg border border-deep-border bg-deep-raised px-3 py-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand text-xs font-semibold text-on-brand">
          MR
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-on-deep">
            Marco Rossi
          </span>
          <span className="block truncate text-xs text-deep-text-faint">
            Tax expert
          </span>
        </span>
      </div>
    </nav>
  );
}
