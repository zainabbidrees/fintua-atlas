import Link from "next/link";
import { Globe2, CheckCircle2, ScrollText, Settings } from "lucide-react";
import { cn } from "@/lib/cn";
import { ApprovalsCount } from "./approvals-count";

export const NAV = [
  { href: "/countries", label: "Countries", icon: Globe2 },
  { href: "/approvals", label: "Approvals", icon: CheckCircle2, count: true },
  { href: "/audit-log", label: "Audit log", icon: ScrollText },
  { href: "/settings", label: "Settings", icon: Settings },
];

/**
 * Renders in both the server shell and the client leaf that knows the current
 * path. Identical markup either way, so the streamed version replaces the
 * fallback without a visible change beyond the highlight appearing.
 */
export function NavList({ activePath }: { activePath: string | null }) {
  return (
    <ul className="mt-9 space-y-1">
      {NAV.map(({ href, label, icon: Icon, count }) => {
        const active = activePath?.startsWith(href) ?? false;
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
              {count && <ApprovalsCount />}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
