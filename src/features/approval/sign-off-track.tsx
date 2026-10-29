"use client";

import { Check, Loader2, Lock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { copy, fill } from "@/lib/copy";
import type { ApprovalRecord, PublishPhase } from "@/lib/types";

type Marker = "done" | "current" | "waiting" | "locked" | "rejected" | "busy";

/**
 * The sign-off, as the path from here to live: first approval, second
 * approval, publish. One track rather than two rows and a separate button, so
 * the order is the thing the eye reads — nothing skips ahead, and a rejection
 * visibly stops everything after it.
 */
export function SignOffTrack({
  l1,
  l2,
  phase,
  ready,
  asApprover,
  onToggleApprover,
  onDecide,
}: {
  l1: ApprovalRecord;
  l2: ApprovalRecord;
  phase: PublishPhase;
  ready: boolean;
  asApprover: boolean;
  onToggleApprover: () => void;
  onDecide: (level: 1 | 2, action: "approved" | "rejected") => void;
}) {
  const t = copy.approval;
  const rejected = l1.status === "rejected" || l2.status === "rejected";
  const bothApproved = l1.status === "approved" && l2.status === "approved";

  const publishMarker: Marker =
    phase === "publishing"
      ? "busy"
      : bothApproved
        ? "current"
        : rejected
          ? "locked"
          : "waiting";
  const publishStatus =
    phase === "publishing"
      ? t.publishInProgress
      : bothApproved
        ? t.publishReady
        : rejected
          ? t.publishStopped
          : t.publishWaiting;

  return (
    <section
      aria-labelledby="sign-off-heading"
      className="rounded-xl border border-border bg-surface shadow-[var(--shadow-raised)]"
    >
      <div className="border-b border-border px-5 pb-4 pt-5">
        <h3 id="sign-off-heading" className="text-[15px] font-medium text-heading">
          {t.signOffHeading}
        </h3>
        <p className="mt-0.5 text-[13px] leading-relaxed text-text-muted">
          {t.signOffHint}
        </p>
      </div>

      <ol className="px-5 py-5">
        {[l1, l2].map((rec) => (
          <ApprovalStage
            key={rec.level}
            rec={rec}
            // Level 2 waits on level 1; both wait on readiness.
            locked={rec.level === 2 && l1.status !== "approved"}
            ready={ready}
            mine={rec.level === 1 ? !asApprover : asApprover}
            onDecide={onDecide}
          />
        ))}
        <Stage
          marker={publishMarker}
          index={3}
          label={t.publishStage}
          group={t.publishStageGroup}
          last
        >
          <p
            className={cn(
              "mt-1 text-[13px]",
              bothApproved ? "text-text" : "text-text-muted",
            )}
          >
            {publishStatus}
          </p>
        </Stage>
      </ol>

      <div className="space-y-2.5 border-t border-border px-5 py-4">
        <p className="text-[12px] leading-relaxed text-text-faint">{t.separation}</p>
        {/* Level 2 belongs to a different group; this lets one person review
            both sides of the hand-off in the prototype. */}
        <button
          type="button"
          onClick={onToggleApprover}
          className="text-[13px] font-medium text-brand underline decoration-brand/40 underline-offset-2 transition-colors hover:decoration-brand"
        >
          {asApprover ? t.viewingAsApprover : t.viewAsApprover}
        </button>
      </div>
    </section>
  );
}

function ApprovalStage({
  rec,
  locked,
  ready,
  mine,
  onDecide,
}: {
  rec: ApprovalRecord;
  locked: boolean;
  ready: boolean;
  mine: boolean;
  onDecide: (level: 1 | 2, action: "approved" | "rejected") => void;
}) {
  const t = copy.approval;
  const pending = rec.status === "pending";
  const actionable = pending && !locked && ready && mine;

  const marker: Marker =
    rec.status === "approved"
      ? "done"
      : rec.status === "rejected"
        ? "rejected"
        : locked || !ready
          ? "locked"
          : mine
            ? "current"
            : "waiting";

  let status: React.ReactNode;
  if (rec.status === "approved") {
    status = (
      <span className="text-settled">
        {fill(t.approvedBy, { name: rec.decidedBy ?? "", at: rec.decidedAt ?? "" })}
      </span>
    );
  } else if (rec.status === "rejected") {
    status = (
      <span className="text-risk">
        {fill(t.rejectedBy, { name: rec.decidedBy ?? "", at: rec.decidedAt ?? "" })}
      </span>
    );
  } else if (locked) {
    status = t.lockedUntilFirst;
  } else if (!ready) {
    status = t.blockedByReadiness;
  } else {
    status = mine ? t.awaitingYou : fill(t.awaitingGroup, { group: rec.group });
  }

  return (
    <Stage marker={marker} index={rec.level} label={rec.label} group={rec.group}>
      <p className="mt-1 text-[13px] text-text-muted">{status}</p>

      {rec.comment && (
        <p className="mt-2 border-l-2 border-border-strong pl-3 text-[13px] leading-relaxed text-text-muted">
          {rec.comment}
        </p>
      )}

      {actionable && (
        <div className="mt-3 flex items-center gap-2">
          <Button size="sm" variant="primary" onClick={() => onDecide(rec.level, "approved")}>
            <Check />
            {t.approve}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onDecide(rec.level, "rejected")}>
            {t.reject}
          </Button>
        </div>
      )}
    </Stage>
  );
}

/** One node on the track: its marker, the line down to the next, its content. */
function Stage({
  marker,
  index,
  label,
  group,
  last = false,
  children,
}: {
  marker: Marker;
  index: number;
  label: string;
  group: string;
  last?: boolean;
  children: React.ReactNode;
}) {
  return (
    <li className={cn("relative grid grid-cols-[1.5rem_minmax(0,1fr)] gap-x-3", !last && "pb-6")}>
      {!last && (
        <span
          aria-hidden
          className={cn(
            "absolute bottom-0 left-[11.5px] top-7 w-px",
            marker === "done" ? "bg-settled/40" : "bg-border",
          )}
        />
      )}

      <span
        aria-hidden
        className={cn(
          "relative flex size-6 items-center justify-center rounded-full text-[12px] font-semibold",
          marker === "done" && "bg-settled text-on-brand",
          marker === "current" && "bg-brand text-on-brand",
          marker === "busy" && "bg-brand-quiet text-brand",
          marker === "waiting" && "border border-border-strong bg-surface text-text-muted",
          marker === "locked" && "border border-border bg-surface-sunken text-text-faint",
          marker === "rejected" && "bg-risk text-on-brand",
        )}
      >
        {marker === "done" ? (
          <Check className="size-3.5" />
        ) : marker === "rejected" ? (
          <X className="size-3.5" />
        ) : marker === "locked" ? (
          <Lock className="size-3" />
        ) : marker === "busy" ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          index
        )}
      </span>

      <div className="min-w-0 pt-0.5">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-[14px] font-medium text-text">{label}</span>
          <span className="text-[12px] text-text-faint">{group}</span>
        </div>
        {children}
      </div>
    </li>
  );
}
