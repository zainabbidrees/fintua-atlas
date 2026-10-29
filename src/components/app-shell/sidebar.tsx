import { Suspense } from "react";
import { Wordmark } from "@/components/brand/logo";
import { ActiveNav } from "./active-nav";
import { NavList } from "./nav-list";
import { UserCard } from "./user-card";

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

      <UserCard />
    </nav>
  );
}
