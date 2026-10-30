import { copy } from "@/lib/copy";
import type { Step } from "@/components/patterns/stepper";

/** The step the AI does the work of: Query Builder writes each box's SQL. */
const AI_STEP = 5;

/**
 * The six onboarding steps as every screen's stepper shows them. The AI step
 * carries a sparkle beside its name.
 */
export const ONBOARDING_STEPS: Step[] = copy.page.stepsLabel.map((label, i) => ({
  id: String(i),
  label,
  ai: i === AI_STEP,
}));

/** The steps a country goes through: all six, or the first five when it has
    no calculated box and so no Query Builder. */
export const onboardingSteps = (withQueryBuilder: boolean): Step[] =>
  withQueryBuilder ? ONBOARDING_STEPS : ONBOARDING_STEPS.slice(0, AI_STEP);
