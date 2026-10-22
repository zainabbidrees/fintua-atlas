import Link from "next/link";
import { Plus, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/** Placeholder list so the wizard has somewhere to start from. */
const RUNS = [
  { code: "DE", flag: "🇩🇪", name: "Germany", step: "Set up", progress: 1, state: "in_progress", updated: "2 hours ago" },
  { code: "IT", flag: "🇮🇹", name: "Italy", step: "Approval", progress: 5, state: "awaiting_approval", updated: "Yesterday" },
  { code: "AT", flag: "🇦🇹", name: "Austria", step: "Live", progress: 5, state: "live", updated: "12 Jun 2026" },
  { code: "AU", flag: "🇦🇺", name: "Australia", step: "Live", progress: 5, state: "live", updated: "2 Apr 2026" },
];

const STATE: Record<string, { label: string; tone: "neutral" | "attention" | "settled" | "brand" }> = {
  in_progress: { label: "In progress", tone: "brand" },
  awaiting_approval: { label: "Awaiting approval", tone: "attention" },
  live: { label: "Live", tone: "settled" },
};

export default function CountriesPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-8 py-12">
      <header className="flex items-end justify-between gap-6">
        <div>
          <h1 className="text-[26px] font-semibold tracking-tight text-text">
            Countries
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Four jurisdictions · two live in Comply
          </p>
        </div>
        <Button variant="primary" asChild>
          <Link href="/countries/new">
            <Plus />
            Add a country
          </Link>
        </Button>
      </header>

      <ul className="mt-8 space-y-2.5">
        {RUNS.map((run) => {
          const state = STATE[run.state];
          return (
            <li key={run.code}>
              <Link
                href="/countries/new"
                className="group flex items-center gap-4 rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow-raised)] transition-colors hover:border-brand-edge hover:bg-brand-quiet/40"
              >
                <span aria-hidden className="text-2xl leading-none">
                  {run.flag}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-[15px] font-semibold text-text">{run.name}</p>
                    <span className="text-xs text-text-faint">{run.code}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-text-muted">
                    {run.step} · updated {run.updated}
                  </p>
                </div>

                {/* Five steps, as five marks — progress readable at a glance. */}
                <div className="hidden items-center gap-1 sm:flex" aria-hidden>
                  {Array.from({ length: 5 }, (_, i) => (
                    <span
                      key={i}
                      className={
                        i < run.progress
                          ? "h-1.5 w-6 rounded-full bg-brand"
                          : "h-1.5 w-6 rounded-full bg-border"
                      }
                    />
                  ))}
                </div>

                <Badge tone={state.tone}>{state.label}</Badge>

                <ArrowUpRight className="size-4 shrink-0 text-text-faint transition-colors group-hover:text-brand" />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
