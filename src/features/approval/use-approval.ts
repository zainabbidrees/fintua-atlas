"use client";

import * as React from "react";
import { approvalDataFor } from "@/lib/mock/approval";
import type { ApprovalRecord, PublishPhase } from "@/lib/types";

/**
 * Maker-checker. Level 1 is a tax specialist, level 2 a second-level approver,
 * and nothing reaches production until both are in. A comment is required on
 * every decision, approve or reject, because an approval without reasoning is
 * indistinguishable from a rubber stamp in an audit.
 */
export function useApproval(countryCode: string) {
  const data = React.useMemo(() => approvalDataFor(countryCode), [countryCode]);

  const [approvals, setApprovals] = React.useState<ApprovalRecord[]>(() =>
    structuredClone(data.approvals),
  );
  const [phase, setPhase] = React.useState<PublishPhase>("awaiting");
  const [publishedAt, setPublishedAt] = React.useState<string | null>(null);
  /** Level 2 is reserved for the approvers group; this makes both views reviewable. */
  const [asApprover, setAsApprover] = React.useState(false);

  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function stamp() {
    return new Date().toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const decide = React.useCallback(
    (level: 1 | 2, status: "approved" | "rejected", comment: string) => {
      setApprovals((all) =>
        all.map((a) =>
          a.level === level
            ? {
                ...a,
                status,
                comment,
                decidedAt: stamp(),
                decidedBy: level === 1 ? "Marco Rossi" : "Elena Fischer",
              }
            : a,
        ),
      );
    },
    [],
  );

  const l1 = approvals.find((a) => a.level === 1)!;
  const l2 = approvals.find((a) => a.level === 2)!;

  /** Level 2 cannot be asked for until level 1 has passed. */
  const l2Unlocked = l1.status === "approved";
  const rejected = approvals.some((a) => a.status === "rejected");
  const bothApproved = l1.status === "approved" && l2.status === "approved";

  const publish = React.useCallback(() => {
    setPhase("publishing");
    timer.current = setTimeout(() => {
      setPhase("published");
      setPublishedAt(stamp());
    }, 1800);
  }, []);

  return {
    ...data,
    approvals,
    l1,
    l2,
    l2Unlocked,
    rejected,
    bothApproved,
    phase,
    publishedAt,
    asApprover,
    setAsApprover,
    decide,
    publish,
  };
}
