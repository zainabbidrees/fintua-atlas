import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { copy } from "@/lib/copy";
import type { StepReview } from "@/lib/review";

/**
 * A step's place in review. Colour follows the app's rule: settled for done,
 * attention for anything waiting on a person's decision, neutral otherwise.
 * A step sent again after changes says so, so the reviewer knows to look.
 */
export function StepStatusBadge({ step }: { step: StepReview }) {
  const t = copy.approvalFlow;
  if (step.status === "approved") {
    return (
      <Badge tone="settled">
        <Check className="size-3" />
        {t.status.approved}
      </Badge>
    );
  }
  if (step.status === "changes") return <Badge tone="attention">{t.status.changes}</Badge>;
  return <Badge>{step.resubmitted ? t.resubmitted : t.status.waiting}</Badge>;
}
