import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { RUNS, filingsLive } from "./data";

/**
 * Holds the right side the way the reference layouts hold it with an image —
 * except this earns the space. It answers the two questions someone opens this
 * page with: is anything waiting on me, and how much is actually live.
 *
 * Sticky, so it stays put while the list scrolls past it.
 */
export function AttentionPanel() {
  const waiting = RUNS.filter((r) => r.state === "awaiting_you");
  const inFlight = RUNS.filter((r) =>
    ["draft", "in_progress", "testing"].includes(r.state),
  ).length;
  const live = filingsLive(RUNS);

  return (
    <aside className="lg:sticky lg:top-10">
      <div className="rounded-2xl bg-deep p-7 text-on-deep">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-deep-text-faint">
          Awaiting your decision
        </p>

        {waiting.length === 0 ? (
          <p className="mt-4 text-[15px] leading-relaxed text-deep-text">
            No jurisdiction is awaiting your decision.
          </p>
        ) : (
          <ul className="mt-5 space-y-3">
            {waiting.map((run) => (
              <li key={run.code}>
                <Link
                  href={`/countries/${run.code}/returns`}
                  className="group flex items-center gap-3.5 rounded-xl border border-deep-border bg-deep-raised p-3.5 transition-colors hover:border-brand"
                >
                  <span
                    aria-hidden
                    className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand font-mono text-[13px] font-semibold text-on-brand"
                  >
                    {run.code}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-on-deep">
                      {run.name}
                    </span>
                    <span className="block truncate text-[13px] text-deep-text-faint">
                      {run.step} · {run.filingsConfirmed} obligations
                    </span>
                  </span>
                  <ArrowUpRight className="size-4 shrink-0 text-deep-text-faint transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-on-deep" />
                </Link>
              </li>
            ))}
          </ul>
        )}

        <dl className="mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-deep-border">
          <Stat label="Obligations live" value={live} />
          <Stat label="In progress" value={inFlight} />
        </dl>
      </div>

      <p className="mt-4 px-1 text-[13px] leading-relaxed text-text-muted">
        Published jurisdictions file automatically. Anything in progress requires
        sign-off before go-live.
      </p>
    </aside>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-deep-raised px-4 py-3.5">
      <dt className="text-[11px] uppercase tracking-[0.08em] text-deep-text-faint">
        {label}
      </dt>
      <dd className="mt-1 font-mono text-[22px] font-semibold tabular-nums leading-none tracking-tight text-on-deep">
        {value}
      </dd>
    </div>
  );
}
