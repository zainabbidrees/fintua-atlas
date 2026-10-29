"use client";

import * as React from "react";
import {
  completedRetrievalFor,
  formsFor,
  retryTrailFor,
} from "@/lib/mock/tax-forms";
import type { FormEdition, FormPage, FormRetrieval } from "@/lib/types";

/** How long each line of a retrieval's trail takes to land. */
const PACE_MS = Number(process.env.NEXT_PUBLIC_MOCK_PACE_MS ?? 700) * 1.6;

/** A copy of `record` without `key`. */
function omit<T>(record: Record<string, T>, key: string): Record<string, T> {
  const next = { ...record };
  delete next[key];
  return next;
}

/** The edition the expert chose where two clashed, and why. */
export interface EditionChoice {
  editionId: string;
  reason: string;
}

/** A form the expert attached where none was found. */
export interface AttachedForm {
  name: string;
  size: number;
}

/** The expert's own file in place of a retrieved form, and why. */
export interface ReplacedForm extends AttachedForm {
  reason: string;
}

/**
 * Review state for the Tax Form Retrieval step.
 *
 * Page selection is kept as the expert's overrides on top of the agent's own
 * ticks, so a page the expert never touched keeps the agent's default and the
 * record shows exactly which ticks were a human's.
 *
 * Retrieval runs per return type, and one can still be reading while the
 * expert works through the others. Nothing here blocks on it.
 */
export function useForms(countryCode: string) {
  const [forms, setForms] = React.useState<FormRetrieval[]>(() =>
    formsFor(countryCode),
  );
  /** How many trail lines each running retrieval has shown so far. */
  const [trailShown, setTrailShown] = React.useState<Record<string, number>>(() =>
    Object.fromEntries(
      formsFor(countryCode)
        .filter((f) => f.state === "retrieving")
        .map((f) => [f.obligationId, 1]),
    ),
  );
  const [overrides, setOverrides] = React.useState<Record<string, boolean>>({});
  const [choices, setChoices] = React.useState<Record<string, EditionChoice>>({});
  const [attached, setAttached] = React.useState<Record<string, AttachedForm>>({});
  const [withoutForm, setWithoutForm] = React.useState<Record<string, string>>({});
  const [replaced, setReplaced] = React.useState<Record<string, ReplacedForm>>({});

  /* Each running retrieval adds a line to its trail, then lands. */
  const running = forms.filter((f) => f.state === "retrieving");
  const runningKey = running
    .map((f) => `${f.obligationId}:${trailShown[f.obligationId] ?? 0}`)
    .join("|");

  React.useEffect(() => {
    if (running.length === 0) return;
    const id = setTimeout(() => {
      // The effect re-runs whenever progress moves, so `trailShown` is current.
      const landed: string[] = [];
      const next = { ...trailShown };
      for (const f of running) {
        const n = (trailShown[f.obligationId] ?? 0) + 1;
        if (n > (f.trail?.length ?? 0)) landed.push(f.obligationId);
        else next[f.obligationId] = n;
      }
      setTrailShown(next);
      if (landed.length === 0) return;
      setForms((all) =>
        all.map((f) =>
          landed.includes(f.obligationId) && f.state === "retrieving"
            ? { ...f, ...completedRetrievalFor(f.obligationId), trail: undefined }
            : f,
        ),
      );
    }, PACE_MS);
    return () => clearTimeout(id);
    // The key stands for `running` and its progress.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runningKey]);

  /** The edition whose pages are under review, once there is exactly one. */
  const editionOf = React.useCallback(
    (f: FormRetrieval): FormEdition | null => {
      if (replaced[f.obligationId]) return null;
      if (f.state === "found") return f.editions[0] ?? null;
      if (f.state === "clash") {
        const choice = choices[f.obligationId];
        return f.editions.find((e) => e.id === choice?.editionId) ?? null;
      }
      return null;
    },
    [choices, replaced],
  );

  const isSelected = React.useCallback(
    (page: FormPage) => overrides[page.id] ?? page.selected,
    [overrides],
  );

  const selectedPages = React.useCallback(
    (f: FormRetrieval): FormPage[] =>
      editionOf(f)?.pages.filter((p) => overrides[p.id] ?? p.selected) ?? [],
    [editionOf, overrides],
  );

  function setPage(pageId: string, on: boolean) {
    setOverrides((o) => ({ ...o, [pageId]: on }));
  }

  function setAllPages(edition: FormEdition, on: boolean) {
    setOverrides((o) => ({
      ...o,
      ...Object.fromEntries(edition.pages.map((p) => [p.id, on])),
    }));
  }

  function chooseEdition(obligationId: string, editionId: string, reason: string) {
    setChoices((c) => ({ ...c, [obligationId]: { editionId, reason } }));
  }

  function clearChoice(obligationId: string) {
    setChoices((c) => omit(c, obligationId));
  }

  function retry(obligationId: string) {
    setForms((all) =>
      all.map((f) =>
        f.obligationId === obligationId
          ? { ...f, state: "retrieving", editions: [], trail: retryTrailFor(f.obligationName) }
          : f,
      ),
    );
    setTrailShown((s) => ({ ...s, [obligationId]: 1 }));
  }

  function attach(obligationId: string, file: AttachedForm) {
    setAttached((a) => ({ ...a, [obligationId]: file }));
  }

  function removeAttached(obligationId: string) {
    setAttached((a) => omit(a, obligationId));
  }

  function replace(obligationId: string, file: ReplacedForm) {
    setReplaced((r) => ({ ...r, [obligationId]: file }));
  }

  function restore(obligationId: string) {
    setReplaced((r) => omit(r, obligationId));
  }

  function continueWithout(obligationId: string, reason: string) {
    setWithoutForm((w) => ({ ...w, [obligationId]: reason }));
  }

  function undoWithout(obligationId: string) {
    setWithoutForm((w) => omit(w, obligationId));
  }

  /**
   * Ready to carry forward: a form with at least one page ticked, or — where
   * none was found — the expert's own upload or their reason for going on
   * without one — or a form the expert replaced with their own file. A
   * retrieval still running, or two editions not yet settled, is never ready.
   */
  const isReady = React.useCallback(
    (f: FormRetrieval): boolean => {
      if (replaced[f.obligationId]) return true;
      if (f.state === "none") return !!attached[f.obligationId] || !!withoutForm[f.obligationId];
      return editionOf(f) !== null && selectedPages(f).length > 0;
    },
    [attached, withoutForm, replaced, editionOf, selectedPages],
  );

  /** Waiting on a decision only a person can make — a clash, or no form. */
  const needsDecision = (f: FormRetrieval) =>
    !replaced[f.obligationId] &&
    ((f.state === "clash" && !choices[f.obligationId]) ||
    (f.state === "none" && !attached[f.obligationId] && !withoutForm[f.obligationId]));

  const withEdition = forms.filter((f) => editionOf(f));
  const totalPages = withEdition.reduce((n, f) => n + (editionOf(f)?.pages.length ?? 0), 0);
  const totalSelected = withEdition.reduce((n, f) => n + selectedPages(f).length, 0);

  return {
    forms,
    trailShown,
    choices,
    attached,
    withoutForm,
    replaced,
    editionOf,
    isSelected,
    selectedPages,
    setPage,
    setAllPages,
    chooseEdition,
    clearChoice,
    retry,
    attach,
    removeAttached,
    replace,
    restore,
    continueWithout,
    undoWithout,
    isReady,
    needsDecision,
    readyCount: forms.filter(isReady).length,
    decisionCount: forms.filter(needsDecision).length,
    allReady: forms.length > 0 && forms.every(isReady),
    totalPages,
    totalSelected,
  };
}

export type FormsState = ReturnType<typeof useForms>;
