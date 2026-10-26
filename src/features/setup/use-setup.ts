"use client";

import * as React from "react";
import { researchCountry, searchForFiling } from "@/lib/mock/research";
import { COLLIDING_DOCUMENT } from "@/lib/mock/fixtures";
import type {
  Country,
  Decision,
  Filing,
  SetupPhase,
  Source,
  TrailEntry,
  UserDocument,
} from "@/lib/types";

/**
 * All the state for the set-up step.
 *
 * Research runs in the background and never blocks the page: the expert can
 * read a source, add a document, or scroll while it works. (The written
 * requirement greyed the whole screen out; that was an earlier draft — the
 * prototype's own later step already runs agents alongside a usable screen.)
 */
export function useSetup() {
  const [country, setCountry] = React.useState<Country | null>(null);
  const [phase, setPhase] = React.useState<SetupPhase>("empty");
  const [trail, setTrail] = React.useState<TrailEntry[]>([]);
  const [filings, setFilings] = React.useState<Filing[]>([]);
  const [sources, setSources] = React.useState<Source[]>([]);
  const [documents, setDocuments] = React.useState<UserDocument[]>([]);
  const [decisions, setDecisions] = React.useState<Decision[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [searching, setSearching] = React.useState(false);
  const [searchMessage, setSearchMessage] = React.useState<string | null>(null);

  const abortRef = React.useRef<AbortController | null>(null);

  const run = React.useCallback(async (next: Country) => {
    // Cancel any run still in flight, so a stale one can't deliver results for
    // the wrong country.
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setPhase("researching");
    setTrail([]);
    setFilings([]);
    setSources([]);
    setError(null);

    try {
      for await (const event of researchCountry(next.code, controller.signal)) {
        if (controller.signal.aborted) return;

        if (event.type === "step") {
          setTrail((t) => [
            ...t,
            { id: `${t.length}-${event.text}`, text: event.text, at: Date.now() },
          ]);
        } else if (event.type === "done") {
          setSources(event.result.sources);
          setFilings(event.result.filings);
          setPhase("found");
        } else if (event.type === "empty") {
          setPhase("nothing_found");
        } else if (event.type === "error") {
          setError(event.message);
          setPhase("failed");
        }
      }
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return;
      setError("Research could not be completed.");
      setPhase("failed");
    }
  }, []);

  const selectCountry = React.useCallback((next: Country) => {
    // Selecting a country no longer starts research on its own. The expert
    // chooses how to begin — a deep search, or a document to research against —
    // so this only sets the country and clears anything from a prior one.
    abortRef.current?.abort();
    setCountry(next);
    setPhase("empty");
    setTrail([]);
    setFilings([]);
    setSources([]);
    setError(null);
    setDocuments([]);
  }, []);

  /** Begins the deep search for the chosen country — the explicit "go". */
  const startResearch = React.useCallback(() => {
    if (country) void run(country);
  }, [country, run]);

  const retry = React.useCallback(() => {
    if (country) void run(country);
  }, [country, run]);

  /** Abandons the whole draft — the expert's own unsaved work on this step —
      and returns to the pristine empty state. Any research in flight is
      stopped first, so it can't deliver results into a discarded draft. */
  const discard = React.useCallback(() => {
    abortRef.current?.abort();
    setCountry(null);
    setPhase("empty");
    setTrail([]);
    setFilings([]);
    setSources([]);
    setDocuments([]);
    setDecisions([]);
    setError(null);
    setSearching(false);
    setSearchMessage(null);
  }, []);

  /** Records the expert's reasoning alongside the change. */
  const record = React.useCallback(
    (action: string, subject: string, reason: string) => {
      setDecisions((d) => [
        ...d,
        {
          id: `${Date.now()}-${subject}`,
          action,
          subject,
          reason,
          at: new Date().toISOString(),
        },
      ]);
    },
    [],
  );

  const removeFiling = React.useCallback(
    (filing: Filing, reason: string) => {
      setFilings((f) => f.filter((x) => x.id !== filing.id));
      record("Removed filing", filing.name, reason);
    },
    [record],
  );

  /** Marks an uncertain filing as checked and accepted by a human. */
  const keepFiling = React.useCallback((filing: Filing) => {
    setFilings((f) =>
      f.map((x) =>
        x.id === filing.id
          ? { ...x, certainty: "confident", uncertainty: undefined }
          : x,
      ),
    );
  }, []);

  const removeSource = React.useCallback(
    (source: Source, reason: string) => {
      setSources((s) => s.filter((x) => x.id !== source.id));
      record("Removed source", source.title, reason);
    },
    [record],
  );

  const addFiling = React.useCallback(
    async (term: string) => {
      if (!country) return;
      setSearching(true);
      setSearchMessage(null);
      const found = await searchForFiling(country.code, term);
      setSearching(false);

      if (!found) {
        setSearchMessage(`No return type matching "${term}" was found for ${country.name}.`);
        return;
      }
      if (filings.some((f) => f.name.toLowerCase() === found.name.toLowerCase())) {
        setSearchMessage(`${found.name} is already in scope.`);
        return;
      }
      setFilings((f) => [...f, found]);
    },
    [country, filings],
  );

  const addDocument = React.useCallback(
    (fileName: string, sizeBytes: number, url?: string) => {
      setDocuments((d) => [
        ...d,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          fileName,
          sizeBytes,
          addedAt: new Date().toISOString(),
          url,
        },
      ]);
    },
    [],
  );

  const removeDocument = React.useCallback((doc: UserDocument) => {
    setDocuments((d) => d.filter((x) => x.id !== doc.id));
  }, []);

  /**
   * Does this upload duplicate something we already found?
   *
   * Not resolved automatically — the expert decides, because a duplicate either
   * confirms what we found or catches a mistake, and both matter.
   */
  const findCollision = React.useCallback(
    (fileName: string) => {
      if (fileName.trim().toLowerCase() !== COLLIDING_DOCUMENT.fileName.toLowerCase()) {
        return null;
      }
      const match = sources.find((s) => s.id === COLLIDING_DOCUMENT.matches.id);
      return match ? { source: match, info: COLLIDING_DOCUMENT } : null;
    },
    [sources],
  );

  React.useEffect(() => () => abortRef.current?.abort(), []);

  const needsCheck = filings.filter((f) => f.certainty === "needs_check").length;

  return {
    country,
    phase,
    trail,
    filings,
    sources,
    documents,
    decisions,
    error,
    searching,
    searchMessage,
    needsCheck,
    selectCountry,
    startResearch,
    retry,
    discard,
    removeFiling,
    keepFiling,
    removeSource,
    addFiling,
    addDocument,
    removeDocument,
    findCollision,
    record,
    clearSearchMessage: () => setSearchMessage(null),
  };
}
