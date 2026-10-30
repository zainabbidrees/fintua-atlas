"use client";

import * as React from "react";
import { Check, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { copy, fill } from "@/lib/copy";
import {
  DEVELOPER_INBOX,
  markAlertDone,
  useDeveloperAlerts,
  type DeveloperAlert,
} from "@/lib/developer-alerts";
import { useSession } from "@/lib/session";
import { when } from "@/features/review/comments-drawer";

type Filter = "open" | "done" | "all";

/**
 * Every column a tax expert added to a tax-rule sheet, waiting on a developer
 * to add it to Comply. Each was emailed too; the row opens that email again,
 * and is marked added once the column is in Comply. Open ones carry the
 * attention edge, since they wait on a person.
 */
export function DeveloperAlertsList() {
  const t = copy.developerAlerts;
  const alerts = useDeveloperAlerts();
  const [filter, setFilter] = React.useState<Filter>("open");

  const counts = {
    open: alerts.filter((a) => !a.doneAt).length,
    done: alerts.filter((a) => a.doneAt).length,
    all: alerts.length,
  };
  const shown = alerts.filter((a) =>
    filter === "all" ? true : filter === "open" ? !a.doneAt : Boolean(a.doneAt),
  );

  return (
    <div className="px-6 py-8 sm:px-12">
      <div className="mx-auto w-full max-w-[1600px]">
        <h1 className="text-[22px] font-medium tracking-tight text-heading">{t.title}</h1>
        <p className="mt-1.5 max-w-[62ch] text-sm leading-relaxed text-text-muted">
          {fill(t.intro, { inbox: DEVELOPER_INBOX })}
        </p>

        {alerts.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed border-border-strong px-6 py-14">
            <p className="text-[15px] font-medium text-heading">{t.empty}</p>
            <p className="mt-1.5 max-w-[62ch] text-[14px] leading-relaxed text-text-muted">
              {t.emptyHint}
            </p>
          </div>
        ) : (
          <>
            <div role="tablist" className="mt-6 flex flex-wrap gap-2">
              {(["open", "done", "all"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  role="tab"
                  aria-selected={filter === f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[13px] font-medium transition-colors",
                    filter === f
                      ? "border-brand-edge bg-brand-quiet text-brand"
                      : "border-border bg-surface text-text hover:bg-wash",
                  )}
                >
                  {t.filters[f]}
                  <span className="text-text-faint" data-numeric>
                    {counts[f]}
                  </span>
                </button>
              ))}
            </div>
            {shown.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-border-strong px-6 py-10 text-[14px] text-text-muted">
                {t.filterEmpty[filter]}
              </p>
            ) : (
              <ul className="mt-4 overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-raised)]">
                {shown.map((a) => (
                  <AlertRow key={a.id} alert={a} />
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function AlertRow({ alert: a }: { alert: DeveloperAlert }) {
  const t = copy.developerAlerts;
  const person = useSession();
  const date = when(a.at);
  const country = a.countryName || a.country;

  /* The same email the alert sent, so it can be opened again in a mail app. */
  const mailto = `mailto:${a.emailedTo}?subject=${encodeURIComponent(
    fill(t.emailSubject, { column: a.column, country, sheet: a.sheet }),
  )}&body=${encodeURIComponent(
    fill(t.emailBody, {
      name: a.by,
      country,
      sheet: a.sheet,
      column: a.column,
      letter: a.letter,
      value: a.value || "—",
      date,
    }),
  )}`;

  return (
    <li
      className={cn(
        "flex flex-col gap-3 border-b border-border px-5 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between",
        !a.doneAt && "shadow-[inset_3px_0_0_var(--attention)]",
      )}
    >
      <div className="min-w-0">
        <p className="text-[15px] font-medium text-heading">
          {fill(t.column, { column: a.column, letter: a.letter })}
        </p>
        <p className="mt-0.5 text-[13px] text-text">
          {fill(t.where, { country, sheet: a.sheet })}
          <span className="text-text-muted">
            {" · "}
            {a.value ? fill(t.defaultValue, { value: a.value }) : t.noDefaultValue}
          </span>
        </p>
        <p className="mt-1 text-[12px] text-text-faint">
          {fill(t.raised, { name: a.by, date })}
          {" · "}
          {fill(t.emailed, { inbox: a.emailedTo })}
        </p>
        {a.doneAt && (
          <p className="mt-1.5 inline-flex items-center gap-1.5 text-[13px] font-medium text-settled">
            <Check className="size-3.5" />
            {fill(t.done, { name: a.doneBy ?? "", date: when(a.doneAt) })}
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <a href={mailto}>
            <Mail />
            {t.openEmail}
          </a>
        </Button>
        {!a.doneAt && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              markAlertDone(a.id, person);
              toast(fill(t.doneToast, { column: a.column }));
            }}
          >
            <Check />
            {t.markDone}
          </Button>
        )}
      </div>
    </li>
  );
}
