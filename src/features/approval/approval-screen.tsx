"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Rocket,
  RotateCcw,
  TriangleAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmWithReason } from "@/components/patterns/confirm-with-reason";
import { DraftActions } from "@/components/patterns/draft-actions";
import { UploadBar } from "@/components/patterns/upload-bar";
import { cn } from "@/lib/cn";
import { copy, fill } from "@/lib/copy";
import { DECISION_KIND_LABEL, type DecisionRecord, type ReadinessCheck } from "@/lib/types";
import { ReleaseCard, StepHeader, stepHref } from "./parts";
import { Published } from "./published";
import { SignOffTrack } from "./sign-off-track";
import { useApproval } from "./use-approval";

type Pending = { level: 1 | 2; action: "approved" | "rejected" } | null;

export function ApprovalScreen({
  countryCode,
  countryName,
}: {
  countryCode: string;
  countryName: string;
}) {
  const router = useRouter();
  const a = useApproval(countryCode);
  const [pending, setPending] = React.useState<Pending>(null);
  const [confirmPublish, setConfirmPublish] = React.useState(false);
  const t = copy.approval;

  if (a.phase === "published") {
    return (
      <Published
        countryName={countryName}
        version={a.version}
        at={a.publishedAt}
        by={a.publishedBy}
        note={a.releaseNote}
        l1={a.l1}
        l2={a.l2}
        scope={a.scope}
      />
    );
  }

  const rejection = a.approvals.find((r) => r.status === "rejected");

  return (
    <div className="pb-24">
      <StepHeader
        backHref={stepHref(countryCode, 3)}
        backLabel={t.backLink}
        title={countryName}
        actions={<DraftActions onDiscard={() => router.push("/countries")} />}
        currentIndex={5}
        completedCount={5}
      />

      <div className="px-6 py-8 sm:px-12">
        <div className="mx-auto w-full max-w-[1600px]">
          {/* The case for signing on the left; the sign-off on the right, held
              in view while the approver reads down the evidence. Stacks below
              lg with the evidence first — read, then sign. */}
          <div className="grid gap-8 [&>*]:min-w-0 lg:grid-cols-[minmax(0,1fr)_23rem] xl:gap-12">
            <aside className="order-2">
              <div className="lg:sticky lg:top-8">
                <SignOffTrack
                  l1={a.l1}
                  l2={a.l2}
                  phase={a.phase}
                  ready={a.ready}
                  asApprover={a.asApprover}
                  onToggleApprover={() => a.setAsApprover((v) => !v)}
                  onDecide={(level, action) => setPending({ level, action })}
                />
              </div>
            </aside>

            <div className="order-1 space-y-10">
              <section>
                <h2 className="text-[22px] font-medium tracking-tight text-heading">
                  {t.title}
                </h2>
                <p className="mt-1.5 max-w-[62ch] text-[14px] leading-relaxed text-text-muted">
                  {a.previousVersion
                    ? fill(t.introReplaces, { version: a.version, previous: a.previousVersion })
                    : fill(t.introNew, { country: countryName, version: a.version })}
                </p>
              </section>

              {rejection && (
                <Rejected
                  version={a.version}
                  comment={rejection.comment}
                  countryCode={countryCode}
                  onResubmit={a.resubmit}
                />
              )}

              <ReleaseCard
                version={a.version}
                previousVersion={a.previousVersion}
                scope={a.scope}
              />

              <Readiness checks={a.readiness} countryCode={countryCode} />

              <Decisions decisions={a.decisions} countryCode={countryCode} />

              {/* Supporting material for the sign-off — a counsel note or
                  evidence an approver wants on the record with their decision. */}
              <UploadBar />
            </div>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/90 px-6 py-3 backdrop-blur sm:px-12 md:left-72">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <Button variant="ghost" asChild className="hidden sm:inline-flex">
            <Link href={stepHref(countryCode, 3)}>
              <ArrowLeft />
              {copy.page.back}
            </Link>
          </Button>

          <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 text-sm",
                a.rejected ? "text-risk" : a.bothApproved ? "text-settled" : "text-text-muted",
              )}
            >
              {a.bothApproved && <Check className="size-4" />}
              {a.rejected ? t.footerRejected : a.bothApproved ? t.footerReady : t.footerNeedBoth}
            </span>
            <Button
              variant="primary"
              disabled={!a.bothApproved || a.phase === "publishing"}
              onClick={() => setConfirmPublish(true)}
              className={cn(a.phase === "publishing" && "cursor-wait")}
            >
              {a.phase === "publishing" ? (
                <>
                  <Loader2 className="animate-spin" />
                  {t.publishing}
                </>
              ) : (
                <>
                  <Rocket />
                  {t.publish}
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
            ? t.rejectTitle
            : pending?.level === 1
              ? t.approveTitleFirst
              : t.approveTitleSecond
        }
        hint={t.decisionHint}
        placeholder={pending?.action === "rejected" ? t.rejectPlaceholder : t.approvePlaceholder}
        confirmLabel={pending?.action === "rejected" ? t.reject : t.approve}
        cancelLabel={t.cancel}
        destructive={pending?.action === "rejected"}
        onConfirm={(reason) => {
          if (pending) a.decide(pending.level, pending.action, reason);
          setPending(null);
        }}
      />

      <ConfirmWithReason
        open={confirmPublish}
        onOpenChange={setConfirmPublish}
        title={t.publishTitle}
        hint={fill(t.publishHint, { country: countryName })}
        placeholder={t.publishPlaceholder}
        confirmLabel={t.publishConfirm}
        cancelLabel={t.cancel}
        destructive={false}
        onConfirm={(note) => {
          setConfirmPublish(false);
          a.publish(note);
        }}
      />
    </div>
  );
}

/** A section label in the style the other steps use for their groups. */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[12px] font-medium uppercase tracking-[0.12em] text-text-faint">
      {children}
    </h3>
  );
}

/** The gate: every check must pass before either approval opens. */
function Readiness({
  checks,
  countryCode,
}: {
  checks: ReadinessCheck[];
  countryCode: string;
}) {
  const t = copy.approval;
  const passed = checks.filter((c) => c.passed).length;
  const all = passed === checks.length;

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <SectionLabel>{t.readinessHeading}</SectionLabel>
        <Badge tone={all ? "settled" : "attention"}>
          {all ? <Check className="size-3" /> : <TriangleAlert className="size-3" />}
          {all
            ? fill(t.readinessAll, { count: checks.length })
            : fill(t.readinessSome, { passed, count: checks.length })}
        </Badge>
      </div>

      {!all && <p className="mt-2 text-[13px] text-attention-text">{t.readinessBlocked}</p>}

      <ul className="mt-3 divide-y divide-border rounded-xl border border-border bg-surface">
        {checks.map((check, i) => (
          <li
            key={check.label}
            className={cn(
              "rise flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3.5",
              !check.passed && "bg-attention-quiet/40",
            )}
            style={{ "--index": i } as React.CSSProperties}
          >
            <span
              aria-hidden
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full",
                check.passed ? "bg-settled-quiet text-settled" : "bg-attention-quiet text-attention-text",
              )}
            >
              {check.passed ? <Check className="size-3" /> : <TriangleAlert className="size-3" />}
            </span>
            <div className="min-w-0 flex-1">
              <span className="block text-[14px] font-medium text-text">{check.label}</span>
              <span className="mt-0.5 block text-[13px] text-text-muted">{check.detail}</span>
            </div>
            <StepLink href={stepHref(countryCode, check.step)} step={check.step} />
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The reason every earlier step asked for a rationale. */
function Decisions({
  decisions,
  countryCode,
}: {
  decisions: DecisionRecord[];
  countryCode: string;
}) {
  const t = copy.approval;
  if (decisions.length === 0) return null;

  return (
    <section>
      <SectionLabel>{t.decisionsHeading}</SectionLabel>
      <p className="mt-2 max-w-[62ch] text-[13px] leading-relaxed text-text-muted">
        {fill(t.decisionsIntro, { count: decisions.length })}
      </p>

      <ul className="mt-3 divide-y divide-border rounded-xl border border-border bg-surface">
        {decisions.map((d, i) => {
          const stepIndex = copy.page.stepsLabel.indexOf(d.step as (typeof copy.page.stepsLabel)[number]);
          return (
            <li
              key={d.id}
              className="rise grid gap-x-6 gap-y-2 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto]"
              style={{ "--index": i } as React.CSSProperties}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                  <p className="text-[14px] font-medium text-text">{d.subject}</p>
                  <Badge>{DECISION_KIND_LABEL[d.kind]}</Badge>
                </div>
                <p className="mt-1 max-w-[70ch] text-[13px] leading-relaxed text-text-muted">
                  {d.reason}
                </p>
                <p className="mt-1.5 text-[12px] text-text-faint">
                  {fill(t.decisionMeta, { step: d.step, by: d.by, at: d.at })}
                </p>
              </div>
              {stepIndex >= 0 && (
                <div className="sm:pt-0.5">
                  <StepLink href={stepHref(countryCode, stepIndex)} step={stepIndex} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** A quiet way back to the step a check or decision belongs to. */
function StepLink({ href, step }: { href: string; step: number }) {
  return (
    <Link
      href={href}
      className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-[13px] font-medium text-text-muted transition-colors hover:text-text"
    >
      {fill(copy.approval.openStep, { step: copy.page.stepsLabel[step] })}
      <ArrowRight className="size-3.5" />
    </Link>
  );
}

/** A rejection stops the release. Say so, show why, and give the way back. */
function Rejected({
  version,
  comment,
  countryCode,
  onResubmit,
}: {
  version: string;
  comment?: string;
  countryCode: string;
  onResubmit: () => void;
}) {
  const t = copy.approval;
  return (
    <section className="rounded-xl border border-risk-edge bg-risk-quiet/50 p-5">
      <h3 className="flex items-center gap-2 text-[15px] font-medium text-risk">
        <TriangleAlert className="size-4 shrink-0" />
        {fill(t.rejectedTitle, { version })}
      </h3>
      {comment && (
        <p className="mt-2 max-w-[70ch] border-l-2 border-risk-edge pl-3 text-[14px] leading-relaxed text-text">
          {comment}
        </p>
      )}
      <p className="mt-2 max-w-[62ch] text-[13px] leading-relaxed text-text-muted">
        {t.rejectedBody}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {/* The steps a fix can land in. Select Country is left out: changing
            the country is a new onboarding, not a fix. */}
        {[1, 2, 3].map((i) => (
          <Button key={i} size="sm" variant="secondary" asChild>
            <Link href={stepHref(countryCode, i)}>
              {fill(t.rejectedReopen, { step: copy.page.stepsLabel[i] })}
            </Link>
          </Button>
        ))}
        <Button size="sm" variant="ghost" onClick={onResubmit}>
          <RotateCcw />
          {t.resubmit}
        </Button>
      </div>
    </section>
  );
}
