"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe2, CheckCircle2, ScrollText, Settings } from "lucide-react";
import { Wordmark } from "@/components/brand/logo";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/countries", label: "Countries", icon: Globe2 },
  { href: "/approvals", label: "Approvals", icon: CheckCircle2, count: 2 },
  { href: "/activity", label: "Activity", icon: ScrollText },
  { href: "/settings", label: "Settings", icon: Settings },
];

/**
 * Pinned to the viewport: `sticky` plus `self-start` and an explicit height,
 * because a flex child stretches to the container by default and then has no
 * room left to stick. Long country runs scroll past it.
 */
export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 hidden h-[100dvh] w-72 shrink-0 flex-col self-start bg-deep px-5 py-7 md:flex">
      <div className="px-2">
        <Wordmark tone="on-deep" />
      </div>

      <ul className="mt-9 space-y-1">
        {NAV.map(({ href, label, icon: Icon, count }) => {
          const active = pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-deep-raised font-medium text-on-deep"
                    : "text-deep-text hover:bg-deep-raised/60 hover:text-on-deep",
                )}
              >
                <Icon className="size-[18px] shrink-0" strokeWidth={1.75} />
                <span className="flex-1">{label}</span>
                {count && (
                  <span className="rounded-full bg-brand px-1.5 py-0.5 text-[11px] font-semibold text-on-brand">
                    {count}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-auto flex items-center gap-3 rounded-lg border border-deep-border bg-deep-raised px-3 py-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-semibold text-on-brand">
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
