import type { Filing, Source } from "../types";
import { findCountry } from "./countries";
import {
  BE_FILINGS,
  BE_SOURCES,
  GENERIC_FILINGS,
  GENERIC_SOURCES,
} from "./fixtures";

/**
 * Stand-in for the research agent.
 *
 * Shaped as a stream rather than a single promise because the screen has to
 * show the work as it happens — an expert who can't see what the machine is
 * doing won't sign their name under its output, and research suggests experts
 * trust machine help less than novices do, not more.
 *
 * Swapping this for a real API should only touch this file.
 */

export interface ResearchResult {
  sources: Source[];
  filings: Filing[];
}

export type ResearchEvent =
  | { type: "step"; text: string }
  | { type: "done"; result: ResearchResult }
  | { type: "empty" }
  | { type: "error"; message: string };

/** Tunable so the timing of the real agent can be simulated during review. */
const PACE_MS = Number(process.env.NEXT_PUBLIC_MOCK_PACE_MS ?? 700);

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException("Aborted", "AbortError"));
    const id = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(id);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

function trailFor(countryName: string, sources: Source[]): string[] {
  const lines = [`Searching for ${countryName}'s tax authority`];
  for (const s of sources) {
    lines.push(`Reading ${new URL(s.url).hostname} — ${s.title}`);
  }
  lines.push("Working out which filings apply");
  return lines;
}

/**
 * Runs the research, yielding each step as it happens.
 *
 * Abort via `signal` when the expert switches country mid-run, so a stale run
 * can't deliver results for the wrong country.
 */
export async function* researchCountry(
  countryCode: string,
  signal?: AbortSignal,
): AsyncGenerator<ResearchEvent> {
  const country = findCountry(countryCode);
  if (!country) {
    yield { type: "error", message: "We don't recognise that country." };
    return;
  }

  // XX is the deliberate failure fixture.
  if (countryCode === "XX") {
    yield { type: "step", text: `Searching for ${country.name}'s tax authority` };
    await wait(PACE_MS * 1.5, signal);
    yield { type: "error", message: "We couldn't reach any sources." };
    return;
  }

  // FR is the deliberate empty fixture.
  if (countryCode === "FR") {
    yield { type: "step", text: `Searching for ${country.name}'s tax authority` };
    await wait(PACE_MS, signal);
    yield { type: "step", text: "Looking for filing requirements" };
    await wait(PACE_MS * 1.5, signal);
    yield { type: "empty" };
    return;
  }

  const sources = countryCode === "BE" ? BE_SOURCES : GENERIC_SOURCES;
  const filings = countryCode === "BE" ? BE_FILINGS : GENERIC_FILINGS;

  for (const line of trailFor(country.name, sources)) {
    yield { type: "step", text: line };
    await wait(PACE_MS, signal);
  }

  yield { type: "done", result: { sources, filings } };
}

/** A targeted search for a filing the agent didn't surface on its own. */
export async function searchForFiling(
  countryCode: string,
  term: string,
  signal?: AbortSignal,
): Promise<Filing | null> {
  await wait(PACE_MS * 2, signal);
  const country = findCountry(countryCode);
  if (!country) return null;

  const sources = countryCode === "BE" ? BE_SOURCES : GENERIC_SOURCES;
  const cleaned = term.trim();
  if (!cleaned) return null;

  // Anything containing "oss" resolves; everything else comes back empty, so
  // both outcomes are reachable in review.
  if (!/oss|one.?stop/i.test(cleaned)) return null;

  return {
    id: `${countryCode.toLowerCase()}-oss`,
    name: "One Stop Shop (OSS) return",
    localName: null,
    frequency: "Quarterly",
    whyItApplies:
      "Used to report cross-border sales to consumers across the EU through a single return.",
    foundOn: sources[0],
    certainty: "confident",
    origin: "added",
  };
}
