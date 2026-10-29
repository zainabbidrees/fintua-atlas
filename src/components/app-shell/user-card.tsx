"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";
import { copy } from "@/lib/copy";
import { useSession } from "@/lib/session";

/** Who is signed in, and as what — the role decides whether steps can be edited. */
export function UserCard() {
  const person = useSession();
  return (
    <div className="mt-auto flex items-center gap-3 rounded-lg border border-deep-border bg-deep-raised px-3 py-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand text-xs font-semibold text-on-brand">
        {person.initials}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-on-deep">{person.name}</span>
        <span className="block truncate text-xs text-deep-text-faint">
          {copy.approvalFlow.roles[person.role]}
        </span>
      </span>
      <Link
        href="/login"
        aria-label={copy.approvalFlow.signOut}
        title={copy.approvalFlow.signOut}
        className="grid size-8 shrink-0 place-items-center rounded-md text-deep-text-faint transition-colors hover:bg-deep hover:text-on-deep"
      >
        <LogOut className="size-4" strokeWidth={1.75} />
      </Link>
    </div>
  );
}
