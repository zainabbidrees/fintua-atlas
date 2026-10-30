"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { copy, fill } from "@/lib/copy";
import {
  approvedCount,
  overallStatus,
  approvalSteps,
  useSubmissions,
  type Submission,
} from "@/lib/review";
import { when } from "./comments-drawer";
import { reviewHref } from "./review-bar";

/**
 * Every country sent for approval, newest first — where a reviewer starts,
 * and where an expert sees what came back. Each row opens that country's
 * approval screen.
 */
export function ApprovalsList() {
  const t = copy.approvalFlow;
  const submissions = useSubmissions();

  return (
    <div className="px-6 py-8 sm:px-12">
      <div className="mx-auto w-full max-w-[1600px]">
        <h1 className="text-[22px] font-medium tracking-tight text-heading">{t.listTitle}</h1>
        <p className="mt-1.5 max-w-[62ch] text-sm leading-relaxed text-text-muted">
          {t.listIntro}
        </p>

        {submissions.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed border-border-strong px-6 py-14">
            <p className="text-[15px] font-medium text-heading">{t.listEmpty}</p>
            <p className="mt-1.5 max-w-[62ch] text-[14px] leading-relaxed text-text-muted">
              {t.listEmptyHint}
            </p>
          </div>
        ) : (
          <div className="mt-8 overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-raised)]">
            <div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)_minmax(0,1.2fr)_minmax(0,1fr)_1rem] gap-6 border-b border-border bg-surface-sunken px-5 py-2.5 text-[12px] font-medium text-text-muted md:grid">
              <span>{t.listColumns.country}</span>
              <span>{t.listColumns.submitted}</span>
              <span>{t.listColumns.progress}</span>
              <span>{t.listColumns.status}</span>
              <span />
            </div>
            <ul>
              {submissions.map((s) => (
                <Row key={s.code} submission={s} />
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ submission: s }: { submission: Submission }) {
  const t = copy.approvalFlow;
  const approved = approvedCount(s);
  const total = approvalSteps(s.code).length;
  const status = overallStatus(s);
  const sent = { name: s.submittedBy, date: when(s.submittedAt) };

  return (
    <li className="border-b border-border last:border-b-0">
      <Link
        href={reviewHref(s.code)}
        className="group grid grid-cols-[minmax(0,1fr)_1rem] items-center gap-x-6 gap-y-1.5 px-5 py-4 transition-colors hover:bg-wash md:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)_minmax(0,1.2fr)_minmax(0,1fr)_1rem]"
      >
        <span className="text-[15px] font-medium text-heading">{s.name}</span>
        <span className="col-start-1 text-[13px] text-text-muted md:col-start-auto">
          <span className="md:hidden">{fill(t.submittedBy, sent)}</span>
          <span className="hidden md:inline">{fill(t.listSent, sent)}</span>
        </span>
        <span className="col-start-1 flex items-center gap-3 md:col-start-auto">
          <span className="h-1.5 w-20 overflow-hidden rounded-full bg-surface-sunken">
            <span
              className="block h-full origin-left rounded-full bg-settled"
              style={{ transform: `scaleX(${approved / total})` }}
            />
          </span>
          <span className="text-[13px] text-text" data-numeric>
            {approved} / {total}
          </span>
        </span>
        <span className="col-start-1 md:col-start-auto">
          <Badge tone={status === "approved" ? "settled" : status === "changes" ? "attention" : "neutral"}>
            {t.status[status]}
          </Badge>
        </span>
        <ChevronRight className="col-start-2 row-span-4 row-start-1 size-4 text-text-faint transition-transform group-hover:translate-x-0.5 md:col-start-auto md:row-span-1 md:row-start-auto" />
      </Link>
    </li>
  );
}
