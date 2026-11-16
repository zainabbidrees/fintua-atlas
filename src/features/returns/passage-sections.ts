import { copy } from "@/lib/copy";
import type { Evidence, ObligationRun } from "@/lib/types";

/**
 * One labelled citation in the passage drawer: a verbatim quote and the source
 * it is drawn from, under a heading that says what the quote establishes — the
 * filing frequency, the deadline, or where that deadline moves on a non-working
 * day. A row's evidence reads as these sections rather than one block, so each
 * fact can be checked against its own wording.
 */
export interface PassageSection {
  key: string;
  label: string;
  quote: string;
  evidence: Evidence;
}

/** The sentence in a passage that states where a deadline moves on a weekend or
    public holiday, when the source spells it out — real wording, not synthesised,
    so it is only offered when the passage actually carries it. */
function nonWorkingDaySentence(article: string | undefined): string | null {
  if (!article) return null;
  const sentence = article
    .split(/(?<=\.)\s+/)
    .find((s) => /\b(working day|Saturday|Sunday|public holiday)\b/i.test(s));
  return sentence ? sentence.trim() : null;
}

/**
 * A row's evidence as sections: one per finding that carries a quote — its
 * frequency and its deadline — and, right after the deadline, where that
 * deadline moves on a non-working day when the deadline's own source says so.
 */
export function passageSectionsFor(o: ObligationRun): PassageSection[] {
  const sections: PassageSection[] = [];
  for (const finding of o.findings) {
    if (!finding.value || !finding.evidence.quote) continue;
    sections.push({
      key: finding.id,
      label: finding.label,
      quote: finding.evidence.quote,
      evidence: finding.evidence,
    });
    if (finding.role === "deadline" && finding.nonWorkingDay && finding.nonWorkingDay !== "none") {
      const sentence = nonWorkingDaySentence(finding.evidence.article);
      if (sentence) {
        sections.push({
          key: `${finding.id}-nwd`,
          label: copy.sources.nonWorkingDaysSection,
          quote: sentence,
          evidence: finding.evidence,
        });
      }
    }
  }
  return sections;
}
