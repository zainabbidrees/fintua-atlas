"use client";

import { useDeveloperAlerts } from "@/lib/developer-alerts";

/** How many developer alerts still wait on a column being added to Comply. */
export function DeveloperAlertsCount() {
  const open = useDeveloperAlerts().filter((a) => !a.doneAt).length;
  if (open === 0) return null;
  return (
    <span className="rounded-full bg-brand px-1.5 py-0.5 text-[12px] font-semibold text-on-brand" data-numeric>
      {open}
    </span>
  );
}
