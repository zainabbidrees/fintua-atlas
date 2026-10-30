"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { copy, fill } from "@/lib/copy";
import { saveDraft } from "@/lib/drafts";
import { useSession } from "@/lib/session";

/**
 * Save draft on a step: keeps a new numbered version of the country's draft,
 * covering every step up to this one, and says which version it was.
 */
export function useSaveDraft(countryCode: string, countryName: string, stepIndex: number) {
  const person = useSession();
  const router = useRouter();
  return () => {
    const draft = saveDraft(countryCode, countryName, stepIndex, person);
    toast(
      fill(copy.drafts.savedToast, {
        version: draft.version,
        country: countryName,
        step: copy.page.stepsLabel[stepIndex],
      }),
      { action: { label: copy.drafts.viewDrafts, onClick: () => router.push("/drafts") } },
    );
  };
}
