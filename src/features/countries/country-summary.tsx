"use client";

import * as React from "react";
import { copy } from "@/lib/copy";
import { readPublished } from "@/lib/published";
import { RUNS, filingsLive, withIds, withPublished } from "./data";

/**
 * The count line under the page title. Client-side so a country published
 * from the Query Builder is counted, read after mount like the list itself.
 */
export function CountrySummary() {
  const [rows, setRows] = React.useState(() => withIds(RUNS));

  React.useEffect(() => {
    const published = readPublished();
    if (published.length === 0) return;
    // Syncing from localStorage after mount is the one case that
    // legitimately needs setState in an effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRows((r) => withPublished(r, published, copy.countries.publishedActivity));
  }, []);

  const live = rows.filter((r) => r.state === "live").length;

  return (
    <p className="mt-0.5 text-[13px] text-text-muted">
      <span className="tabular-nums">{rows.length}</span> jurisdictions ·{" "}
      <span className="tabular-nums">{live}</span> published ·{" "}
      <span className="tabular-nums">{filingsLive(rows)}</span> obligations filing
    </p>
  );
}
