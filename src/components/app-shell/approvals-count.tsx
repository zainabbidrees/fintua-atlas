"use client";

import { overallStatus, useSubmissions } from "@/lib/review";

/** How many submissions are still open — not yet approved in full. */
export function ApprovalsCount() {
  const open = useSubmissions().filter((s) => overallStatus(s) !== "approved").length;
  if (open === 0) return null;
  return (
    <span className="rounded-full bg-brand px-1.5 py-0.5 text-[12px] font-semibold text-on-brand" data-numeric>
      {open}
    </span>
  );
}
