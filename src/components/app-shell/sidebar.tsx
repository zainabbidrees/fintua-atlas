"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe2, CheckCircle2, ScrollText, Settings } from "lucide-react";
import { DotTexture, Wordmark } from "@/components/brand/logo";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/countries", label: "Countries", icon: Globe2 },
  { href: "/approvals", label: "Approvals", icon: CheckCircle2, count: 2 },
  { href: "/activity", label: "Activity", icon: ScrollText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="relative hidden w-60 shrink-0 flex-col overflow-hidden bg-deep px-4 py-6 md:flex">
      <DotTexture className="text-on-deep/[0.05]" />

      <div className="relative px-2">
        <Wordmark tone="on-deep" />
      </div>

      <ul className="relative mt-8 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon, count }) => {
          const active = pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-deep-raised font-medium text-on-deep"
                    : "text-deep-text hover:bg-deep-raised/60 hover:text-on-deep",
                )}
              >
                <Icon className="size-4 shrink-0" />
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

      <div className="relative mt-auto flex items-center gap-2.5 rounded-lg border border-deep-border bg-deep-raised px-3 py-2.5">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-semibold text-on-brand">
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
