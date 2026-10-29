"use client";

import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { copy, fill } from "@/lib/copy";
import type { ApprovalRecord } from "@/lib/types";
import { ReleaseCard, StepHeader, type Scope } from "./parts";

/**
 * The end of the run. Not a celebration screen floating outside the app: the
 * same frame as every step, with all five ticked, so the expert sees the whole
 * journey closed. Below it, the record of what went live and who signed —
 * the thing anyone will come back to later — and where to go next.
 */
export function Published({
  countryName,
  version,
  at,
  by,
  note,
  l1,
  l2,
  scope,
}: {
  countryName: string;
  version: string;
  at: string | null;
  by: string | null;
  note: string;
  l1: ApprovalRecord;
  l2: ApprovalRecord;
  scope: Scope;
}) {
  const t = copy.approval.published;
  const signer = (r: ApprovalRecord) => `${r.decidedBy ?? ""} · ${r.decidedAt ?? ""}`;

  const record: { label: string; value: string; wide?: boolean; muted?: boolean }[] = [
    { label: t.version, value: version },
    { label: t.publishedAt, value: at ?? "" },
    { label: t.publishedBy, value: by ?? "" },
    { label: copy.approval.publishesToLabel, value: copy.approval.publishesTo },
    { label: t.firstApproval, value: signer(l1) },
    { label: t.secondApproval, value: signer(l2) },
    { label: t.note, value: note || t.noteEmpty, wide: true, muted: !note },
  ];

  return (
    <div className="pb-16">
      <StepHeader
        backHref="/countries"
        backLabel={copy.approval.published.backLink}
        title={countryName}
        // Past the last step: every step reads done, none current.
        currentIndex={6}
        completedCount={6}
      />

      <div className="px-6 py-8 sm:px-12">
        <div className="mx-auto w-full max-w-[1600px]">
          <div className="grid gap-8 [&>*]:min-w-0 lg:grid-cols-[minmax(0,1fr)_23rem] xl:gap-12">
            <div className="space-y-8">
              <section className="rise">
                <span className="inline-flex items-center gap-2 rounded-full bg-settled-quiet px-2.5 py-1 text-[12px] font-medium text-settled">
                  <span aria-hidden className="size-1.5 rounded-full bg-settled" />
                  {t.badge}
                </span>
                <h2 className="mt-3 text-[22px] font-medium tracking-tight text-heading">
                  {fill(t.title, { country: countryName })}
                </h2>
                <p className="mt-1.5 max-w-[62ch] text-[14px] leading-relaxed text-text-muted">
                  {fill(t.body, { version, at: at ?? "", country: countryName })}
                </p>
              </section>

              <div className="rise" style={{ "--index": 1 } as React.CSSProperties}>
                <ReleaseCard version={version} previousVersion={null} scope={scope} />
              </div>

              <section className="rise" style={{ "--index": 2 } as React.CSSProperties}>
                <h3 className="text-[12px] font-medium uppercase tracking-[0.12em] text-text-faint">
                  {t.recordHeading}
                </h3>
                <dl className="mt-3 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2">
                  {record.map((row) => (
                    <div
                      key={row.label}
                      className={row.wide ? "bg-surface px-5 py-3.5 sm:col-span-2" : "bg-surface px-5 py-3.5"}
                    >
                      <dt className="text-[12px] text-text-faint">{row.label}</dt>
                      <dd
                        className={
                          row.muted
                            ? "mt-0.5 text-[14px] text-text-faint"
                            : "mt-0.5 text-[14px] text-text"
                        }
                      >
                        {row.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            </div>

            <aside>
              <section
                className="rise rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-raised)] lg:sticky lg:top-8"
                style={{ "--index": 1 } as React.CSSProperties}
              >
                <h3 className="text-[15px] font-medium text-heading">{t.nextHeading}</h3>
                <ol className="mt-4 space-y-3.5">
                  {t.next.map((line, i) => (
                    <li key={line} className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-x-3">
                      <span className="flex size-6 items-center justify-center rounded-full border border-border-strong text-[12px] font-semibold text-text-muted">
                        {i + 1}
                      </span>
                      <span className="pt-0.5 text-[13px] leading-relaxed text-text-muted">
                        {fill(line, { country: countryName })}
                      </span>
                    </li>
                  ))}
                </ol>

                <div className="mt-6 flex flex-col gap-2 border-t border-border pt-5">
                  <Button variant="primary" asChild>
                    <Link href="/countries">
                      {t.backToCountries}
                      <ArrowRight />
                    </Link>
                  </Button>
                  <Button variant="secondary" asChild>
                    <Link href="/countries/new">
                      <Plus />
                      {t.onboardAnother}
                    </Link>
                  </Button>
                  <Link
                    href="/audit-log"
                    className="mt-1 self-center text-[13px] font-medium text-text-muted transition-colors hover:text-text"
                  >
                    {t.auditTrail}
                  </Link>
                </div>
              </section>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
