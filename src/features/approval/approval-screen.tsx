"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Loader2,
  Lock,
  Rocket,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmWithReason } from "@/components/patterns/confirm-with-reason";
import { Stepper } from "@/components/patterns/stepper";
import { copy } from "@/lib/copy";
import { DECISION_KIND_LABEL } from "@/lib/types";
import { cn } from "@/lib/cn";
import { useApproval } from "./use-approval";

const STEPS = copy.page.stepsLabel.map((label, i) => ({ id: String(i), label }));

type Pending = { level: 1 | 2; action: "approved" | "rejected" } | null;

export function ApprovalScreen({
  countryCode,
  countryName,
}: {
  countryCode: string;
  countryName: string;
}) {
  const a = useApproval(countryCode);
  const [pending, setPending] = React.useState<Pending>(null);
  const [confirmPublish, setConfirmPublish] = React.useState(false);

  if (a.phase === "published") {
    return (
      <Published
        countryName={countryName}
        version={a.version}
        at={a.publishedAt}
        scope={a.scope}
      />
    );
  }

  return (
    <div className="pb-24">
      <header className="border-b border-border bg-surface px-6 pt-8 sm:px-12">
        <div className="mx-auto w-full max-w-4xl">
          <Link
            href={`/countries/${countryCode}/build`}
            className="inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-brand"
          >
            <ArrowLeft className="size-3.5" />
            Build
          </Link>

          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-[22px] font-semibold tracking-tight text-text">
                {countryName}
              </h1>
              <p className="mt-0.5 text-sm text-text-muted">
                Step 5 of 5 · Approval &amp; Publish
              </p>
            </div>
            <Button variant="secondary" size="sm">
              {copy.page.saveDraft}
            </Button>
          </div>

          <div className="-mx-6 mt-6 overflow-x-auto px-6 pb-4 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="min-w-[34rem]">
              <Stepper steps={STEPS} currentIndex={4} completedCount={4} />
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-4xl px-6 py-10 sm:px-12">
        {/* What is being signed for. Belgium has no prior version, so there is
            nothing to diff — saying so beats showing an empty comparison. */}
        <section>
          <h2 className="text-[17px] font-semibold tracking-tight text-text">
            Publishing {a.version} of {countryName}
          </h2>
          <p className="mt-1.5 max-w-[64ch] text-[13px] leading-relaxed text-text-muted">
            {a.previousVersion
              ? `Replaces ${a.previousVersion} in Comply.`
              : `${countryName} has not been published before, so everything here is new: `}
            {!a.previousVersion && (
              <>
                <span className="tabular-nums">{a.scope.obligations}</span>{" "}
                obligations, <span className="tabular-nums">{a.scope.boxes}</span>{" "}
                return boxes,{" "}
                <span className="tabular-nums">{a.scope.rules}</span> mapping
                rules and <span className="tabular-nums">{a.scope.rates}</span>{" "}
                rates.
              </>
            )}
          </p>
        </section>

        <section className="mt-9">
          <h3 className="text-[11px] font-medium uppercase tracking-[0.12em] text-text-faint">
            Readiness
          </h3>
          <ul className="mt-2 border-t border-border">
            {a.readiness.map((check) => (
              <li
                key={check.label}
                className="flex flex-col gap-1 border-b border-border py-3 last:border-0 sm:flex-row sm:items-baseline sm:gap-3"
              >
                <span className="flex items-baseline gap-3 sm:contents">
                  <Check
                    aria-hidden
                    className={cn(
                      "size-3.5 shrink-0 translate-y-0.5",
                      check.passed ? "text-settled" : "text-text-faint",
                    )}
                  />
                  <span className="text-[14px] text-text sm:w-56 sm:shrink-0">
                    {check.label}
                  </span>
                </span>
                <span className="min-w-0 pl-6 text-[13px] text-text-muted sm:pl-0">
                  {check.detail}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* The reason every earlier step asked for a rationale. */}
        <section className="mt-9">
          <h3 className="text-[11px] font-medium uppercase tracking-[0.12em] text-text-faint">
            What a human overruled
          </h3>
          <p className="mt-2 max-w-[64ch] text-[13px] leading-relaxed text-text-muted">
            Everything else came from the research unchanged. These{" "}
            <span className="tabular-nums">{a.decisions.length}</span> decisions
            did not.
          </p>

          <ul className="mt-4 border-t border-border">
            {a.decisions.map((d, i) => (
              <li
                key={d.id}
                className="rise border-b border-border py-4 last:border-0"
                style={{ "--index": i } as React.CSSProperties}
              >
                <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                  <span className="text-[14px] font-medium text-text">
                    {d.subject}
                  </span>
                  <span className="text-[12px] text-text-faint">
                    {DECISION_KIND_LABEL[d.kind]} · {d.step} · {d.by} · {d.at}
                  </span>
                </div>
                <p className="mt-1 max-w-[70ch] text-[13px] leading-relaxed text-text-muted">
                  {d.reason}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-9">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
            <h3 className="text-[11px] font-medium uppercase tracking-[0.12em] text-text-faint">
              Approvals
            </h3>
            <button
              type="button"
              onClick={() => a.setAsApprover((v) => !v)}
              className="text-[13px] font-medium text-text-muted underline-offset-4 transition-colors hover:text-brand hover:underline"
            >
              {a.asApprover
                ? "Viewing as Elena Fischer · second-level approver"
                : "View as second-level approver"}
            </button>
          </div>

          <ul className="mt-2 border-t border-border">
            {a.approvals.map((rec) => {
              const locked = rec.level === 2 && !a.l2Unlocked;
              const mine = rec.level === 1 ? !a.asApprover : a.asApprover;
              const actionable = rec.status === "pending" && !locked && mine;

              return (
                <li
                  key={rec.level}
                  className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3 border-b border-border py-4 last:border-0"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                      <span className="text-[14px] font-medium text-text">
                        {rec.label}
                      </span>
                      <span className="text-[12px] text-text-faint">
                        {rec.group}
                      </span>
                    </div>

                    <p className="mt-1 text-[13px] text-text-muted">
                      {rec.status === "approved" && (
                        <span className="text-settled">
                          Approved by {rec.decidedBy} · {rec.decidedAt}
                        </span>
                      )}
                      {rec.status === "rejected" && (
                        <span className="text-risk">
                          Rejected by {rec.decidedBy} · {rec.decidedAt}
                        </span>
                      )}
                      {rec.status === "pending" &&
                        (locked
                          ? "Opens once the first approval is in"
                          : mine
                            ? "Awaiting your decision"
                            : `Awaiting ${rec.group}`)}
                    </p>

                    {rec.comment && (
                      <p className="mt-1.5 max-w-[70ch] border-l border-border-strong pl-3 text-[13px] leading-relaxed text-text-muted">
                        {rec.comment}
                      </p>
                    )}
                  </div>

                  {actionable && (
                    <div className="flex items-center gap-3">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() =>
                          setPending({ level: rec.level, action: "approved" })
                        }
                      >
                        Approve
                      </Button>
                      <button
                        type="button"
                        onClick={() =>
                          setPending({ level: rec.level, action: "rejected" })
                        }
                        className="text-[13px] font-medium text-text-muted transition-colors hover:text-risk"
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {rec.status === "pending" && locked && (
                    <Lock aria-hidden className="mt-1 size-3.5 shrink-0 text-text-faint" />
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        {a.rejected && (
          <p className="mt-6 flex max-w-[70ch] items-start gap-2 text-[13px] leading-relaxed text-risk">
            <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
            This version was rejected and will not publish. Address the comment
            above in the relevant step, then request approval again.
          </p>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-surface/90 backdrop-blur md:left-72">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-2 px-6 py-3 sm:px-12 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <Button variant="ghost" asChild className="hidden sm:inline-flex">
            <Link href={`/countries/${countryCode}/build`}>{copy.page.back}</Link>
          </Button>

          <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-2">
            {!a.bothApproved && !a.rejected && (
              <span className="text-sm text-text-muted">
                Both approvals are needed before publishing
              </span>
            )}
            <Button
              variant="primary"
              disabled={!a.bothApproved || a.phase === "publishing"}
              onClick={() => setConfirmPublish(true)}
              className={cn(a.phase === "publishing" && "cursor-wait")}
            >
              {a.phase === "publishing" ? (
                <>
                  <Loader2 className="animate-spin" />
                  Publishing
                </>
              ) : (
                <>
                  <Rocket />
                  Publish to Comply
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* The same component used for removals — a decision without a reason is
          indistinguishable from a rubber stamp once it is in the audit log. */}
      <ConfirmWithReason
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
        title={
          pending?.action === "rejected"
            ? "Reject this version"
            : `Approve ${pending?.level === 1 ? "at first level" : "for production"}`
        }
        hint="A comment is recorded against every decision."
        placeholder={
          pending?.action === "rejected"
            ? "e.g. box 45 mapping needs counsel sign-off first"
            : "e.g. rates verified against Royal Decree No 20"
        }
        confirmLabel={pending?.action === "rejected" ? "Reject" : "Approve"}
        cancelLabel="Cancel"
        destructive={pending?.action === "rejected"}
        onConfirm={(reason) => {
          if (pending) a.decide(pending.level, pending.action, reason);
          setPending(null);
        }}
      />

      <ConfirmWithReason
        open={confirmPublish}
        onOpenChange={setConfirmPublish}
        title="Publish to production"
        hint={`${countryName} becomes fileable for every Comply client. Record what this release covers.`}
        placeholder="e.g. initial Belgian onboarding, effective 1 Jan 2026"
        confirmLabel="Publish"
        cancelLabel="Cancel"
        destructive={false}
        onConfirm={() => {
          setConfirmPublish(false);
          a.publish();
        }}
      />
    </div>
  );
}

function Published({
  countryName,
  version,
  at,
  scope,
}: {
  countryName: string;
  version: string;
  at: string | null;
  scope: { obligations: number; rules: number; rates: number; boxes: number };
}) {
  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-xl flex-col justify-center px-6 py-16 sm:px-10">
      <span className="grid size-11 place-items-center rounded-full bg-settled-quiet">
        <Check className="size-5 text-settled" />
      </span>

      <h1 className="mt-6 text-[26px] font-semibold leading-tight tracking-tight text-text">
        {countryName} is live in Comply.
      </h1>
      <p className="mt-2 max-w-[56ch] text-[15px] leading-relaxed text-text-muted">
        {version} published {at}. Clients registered in {countryName} can file{" "}
        <span className="tabular-nums">{scope.obligations}</span> obligations
        from the next period. Every decision in this onboarding is recorded in
        the audit log.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-3">
        <Button variant="primary" asChild>
          <Link href="/countries">Back to Countries</Link>
        </Button>
        <Link
          href="/audit-log"
          className="text-[13px] font-medium text-text-muted transition-colors hover:text-brand"
        >
          View the audit trail
        </Link>
      </div>
    </div>
  );
}
