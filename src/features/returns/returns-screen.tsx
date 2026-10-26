"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowLeft, ArrowRight, Check, Link2, Loader2, Paperclip, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DraftActions } from "@/components/patterns/draft-actions";
import { Stepper } from "@/components/patterns/stepper";
import { UploadBar } from "@/components/patterns/upload-bar";
import { copy } from "@/lib/copy";
import { FINDING_GROUP_LABEL, type FindingGroup } from "@/lib/types";
import { FindingRow } from "./finding-row";
import { ObligationRail } from "./obligation-rail";
import { useReturns } from "./use-returns";

const STEPS = copy.page.stepsLabel.map((label, i) => ({ id: String(i), label }));
const GROUP_ORDER: FindingGroup[] = ["filing", "rates", "rules"];

export function ReturnsScreen({
  countryCode,
  countryName,
}: {
  countryCode: string;
  countryName: string;
}) {
  const router = useRouter();
  const r = useReturns(countryCode);
  const clearedReturns = r.obligations.filter(r.isSettled).length;

  return (
    // A fixed-height shell: the header, rail and footer stay put, and only the
    // findings column scrolls — so reviewing a long return never moves the
    // navigation or the action bar out from under the hand.
    <div className="flex h-[100dvh] flex-col overflow-hidden">
      <header className="shrink-0 border-b border-border bg-surface px-6 pt-8 sm:px-12">
        <div className="mx-auto w-full max-w-[1600px]">
          <Link
            href="/countries"
            className="inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-text"
          >
            <ArrowLeft className="size-3.5" />
            Countries
          </Link>

          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-[22px] font-medium tracking-tight text-heading">
                {countryName}
              </h1>
            </div>
            <DraftActions onDiscard={() => router.push("/countries")} />
          </div>

          <div className="-mx-6 mt-6 overflow-x-auto px-6 pb-4 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="min-w-max">
              <Stepper steps={STEPS} currentIndex={1} completedCount={1} />
            </div>
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 px-6 sm:px-12">
        <div className="mx-auto grid h-full w-full max-w-[1600px] grid-rows-[auto_minmax(0,1fr)] gap-x-6 [&>*]:min-w-0 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] lg:grid-rows-1">
          {/* The rail is a white panel that runs up to meet the header. Its
              white fills the page gutter on the left too, so it reads as one
              surface joined to the sidebar rather than a card floating on the
              grey canvas — the before: strip paints that gutter at lg, where the
              two-column layout and the gutter exist. It stays put while only the
              findings scroll; a hairline on its right edge sets it apart from
              the work, and the upload bar is pinned to the foot. */}
          <div className="relative flex min-h-0 flex-col bg-surface pt-8 lg:border-r lg:border-border lg:pr-6 lg:before:absolute lg:before:inset-y-0 lg:before:right-full lg:before:w-12 lg:before:bg-surface lg:before:content-['']">
            <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <ObligationRail
                obligations={r.obligations}
                selectedId={r.selectedId}
                onSelect={r.setSelectedId}
                outstanding={r.outstanding}
                isSettled={r.isSettled}
              />
            </div>

            {/* Supporting material — a form or an advisor's note the research
                didn't surface — kept at the foot of the rail, always in reach. */}
            <UploadBar stacked onAdd={r.addUpload} className="shrink-0 pb-6 pt-6" />
          </div>

          {/* The one scrolling region on the screen. */}
          <div className="min-h-0 overflow-y-auto pb-8 pt-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {r.selected && <Detail key={r.selected.id} run={r.selected} r={r} />}
          </div>
        </div>
      </div>

      <div className="shrink-0 border-t border-border bg-surface px-6 py-3 sm:px-12">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <Button variant="ghost" asChild className="hidden sm:inline-flex">
            <Link href="/countries/new">
              <ArrowLeft />
              {copy.page.back}
            </Link>
          </Button>

          <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-2">
            {/* Speaks in return types, not scattered findings: the gate is
                clearing every return, and the message counts exactly that. */}
            {!r.allSettled && (
              <span className="text-sm text-text-muted">
                <span className="font-medium tabular-nums text-text">
                  {clearedReturns}
                </span>{" "}
                of{" "}
                <span className="tabular-nums">{r.obligations.length}</span>{" "}
                return types cleared
              </span>
            )}
            {r.allSettled ? (
              <Button variant="primary" asChild>
                <Link href={`/countries/${countryCode}/rules`}>
                  Continue to Specs &amp; Datasets
                  <ArrowRight />
                </Link>
              </Button>
            ) : (
              <Button variant="primary" disabled>
                Continue to Specs &amp; Datasets
                <ArrowRight />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * A pinned shortcut down to the flagged rows.
 *
 * On a long return the two values that still need a person can sit far down the
 * list. This stays stuck to the top of the scrolling column and, on each click,
 * steps to the next flagged row and centres it — so they are one click away
 * however far the list runs, and a second click walks to the next. It carries
 * no count: the rail already says how many, and repeating it here was the thing
 * the heading pill was removed for. Hidden once nothing is left to review.
 */
function ReviewJump({ count }: { count: number }) {
  const cursor = React.useRef(0);

  if (count <= 0) return null;

  return (
    // The wrapper takes no pointer events so it never shades the row beneath;
    // only the pill itself is live. The negative margin lets the heading sit
    // up beside it rather than below a reserved band.
    <div className="pointer-events-none sticky top-0 z-20 -mb-9 flex justify-end">
      <button
        type="button"
        onClick={() => {
          const items = Array.from(
            document.querySelectorAll<HTMLElement>("[data-review-item]"),
          );
          if (items.length === 0) return;
          const i = cursor.current % items.length;
          cursor.current = i + 1;
          const reduce = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
          ).matches;
          items[i].scrollIntoView({
            behavior: reduce ? "auto" : "smooth",
            block: "center",
          });
        }}
        className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-attention-edge bg-attention-quiet px-3 py-1.5 text-[13px] font-medium text-attention-text shadow-[var(--shadow-raised)] transition-colors hover:border-attention/50 active:scale-[0.98]"
      >
        <ArrowDown className="size-3.5" />
        {copy.review.jump}
      </button>
    </div>
  );
}

function Detail({
  run,
  r,
}: {
  run: ReturnType<typeof useReturns>["selected"];
  r: ReturnType<typeof useReturns>;
}) {
  /* Which values are ticked for a bulk action. Reset per return — the parent
     keys this component by the obligation id. */
  const [selected, setSelected] = React.useState<ReadonlySet<string>>(new Set());

  if (!run) return null;

  const corroborated = run.findings.filter((f) => f.state === "corroborated").length;
  const needsReview = run.findings.filter((f) => f.state === "needs_review").length;

  if (run.agent === "running") {
    return <Researching name={run.name} progress={run.progress} />;
  }

  const toggle = (id: string, on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  const clearSelection = () => setSelected(new Set());
  const selectedIds = [...selected];

  return (
    <section>
      {/* Pinned shortcut down to the flagged rows. Hidden while a bulk
          selection is live, so it never sits over the selection bar. */}
      {selected.size === 0 && <ReviewJump count={needsReview} />}

      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
        <div>
          <h2 className="text-[19px] font-medium tracking-tight text-heading">
            {run.name}
          </h2>
          {run.localName && (
            <p className="mt-0.5 text-sm text-text-muted">{run.localName}</p>
          )}
        </div>

        {/* Top-right of the heading: while values are ticked it carries the
            bulk actions and the user acts here. The outstanding count is not
            repeated here — the rail already carries it per return type — so once
            nothing is ticked the slot shows only the completion cue. Bulk
            confirm is a logged break from the per-value rule — see
            docs/decisions/deviations.md. */}
        {selected.size > 0 ? (
          <SelectionBar
            count={selected.size}
            total={run.findings.length}
            onSelectAll={() =>
              setSelected(new Set(run.findings.map((f) => f.id)))
            }
            onClear={clearSelection}
            onConfirm={() => {
              r.confirmMany(selectedIds);
              clearSelection();
            }}
            onDelete={() => {
              r.dismiss(selectedIds);
              clearSelection();
            }}
          />
        ) : needsReview === 0 && corroborated === 0 ? (
          <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-settled">
            <Check className="size-4" />
            All confirmed
          </span>
        ) : null}
      </div>

      <div className="mt-6 space-y-8">
        {GROUP_ORDER.map((group) => {
          const rows = run.findings.filter((f) => f.group === group);
          if (rows.length === 0) return null;

          return (
            <div key={group}>
              <h3 className="px-1 text-[12px] font-medium uppercase tracking-[0.12em] text-text-faint">
                {FINDING_GROUP_LABEL[group]}
              </h3>
              {/* Each finding is its own card, so its review state — editing,
                  confirming, the flagged accent — is self-contained and never
                  bleeds into its neighbours. */}
              <ul className="mt-2 space-y-3">
                {rows.map((finding) => (
                  <FindingRow
                    key={finding.id}
                    finding={finding}
                    selected={selected.has(finding.id)}
                    onSelectedChange={(on) => toggle(finding.id, on)}
                    onConfirm={() => r.confirm(finding.id)}
                    onEdit={(value, reason) => r.edit(finding, value, reason)}
                    onReset={() => r.reset(finding.id)}
                    onRestore={(f) => r.restore(f)}
                    onDelete={() => r.dismiss([finding.id])}
                  />
                ))}
              </ul>
            </div>
          );
        })}

        {/* The expert's own attachments, in the same card format as the agent's
            findings above — a group of their own rather than a list hidden in
            the rail. */}
        {r.uploads.length > 0 && (
          <div>
            <h3 className="px-1 text-[12px] font-medium uppercase tracking-[0.12em] text-text-faint">
              {copy.uploadBar.groupLabel}
            </h3>
            <ul className="mt-2 space-y-3">
              {r.uploads.map((u) => (
                <li
                  key={u.id}
                  className="relative overflow-hidden rounded-xl border border-border bg-surface px-5 py-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-md bg-wash text-text-muted">
                        {u.kind === "file" ? (
                          <Paperclip className="size-4" />
                        ) : (
                          <Link2 className="size-4" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <span className="block text-[12px] text-text-faint">
                          {u.kind === "file"
                            ? copy.uploadBar.fileKind
                            : copy.uploadBar.linkKind}
                        </span>
                        <span className="mt-0.5 block truncate text-[15px] font-medium text-text">
                          {u.label}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => r.removeUpload(u.id)}
                      aria-label={`Remove ${u.label}`}
                      className="grid size-7 shrink-0 place-items-center rounded-md text-text-faint transition-colors hover:bg-risk-quiet hover:text-risk"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

    </section>
  );
}

/**
 * Bulk actions for the ticked values — a compact cluster in the top-right of
 * the return heading, where the user selects and acts in the same place. Delete
 * drops the selected findings from the return; Confirm accepts them together.
 */
function SelectionBar({
  count,
  total,
  onSelectAll,
  onClear,
  onConfirm,
  onDelete,
}: {
  count: number;
  total: number;
  onSelectAll: () => void;
  onClear: () => void;
  onConfirm: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="inline-flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-border-strong bg-surface px-3 py-1.5 shadow-[var(--shadow-raised)]">
      <span className="text-[13px] font-medium text-text">
        <span className="tabular-nums">{count}</span> selected
      </span>
      {/* Extend the selection to every value in the return — shown only while
          there's something left to add. */}
      {count < total && (
        <button
          type="button"
          onClick={onSelectAll}
          className="text-[13px] font-medium text-brand transition-opacity hover:opacity-80"
        >
          Select all
        </button>
      )}
      <button
        type="button"
        onClick={onClear}
        className="text-[13px] font-medium text-text-muted transition-colors hover:text-text"
      >
        Clear
      </button>
      <span aria-hidden className="h-4 w-px bg-border" />
      <Button size="sm" variant="secondary" onClick={onDelete}>
        <Trash2 />
        Delete
      </Button>
      <Button size="sm" variant="primary" onClick={onConfirm}>
        <Check />
        Confirm
      </Button>
    </div>
  );
}

/** Partial state: the agent is still working, and the page stays usable. */
function Researching({ name, progress }: { name: string; progress: number }) {
  return (
    <section>
      <h2 className="text-[19px] font-medium tracking-tight text-heading">{name}</h2>
      <p className="mt-0.5 text-sm text-text-muted">
        Research is still running. Findings appear here as they are retrieved —
        you can work on another return type meanwhile.
      </p>

      <div className="mt-6 rounded-xl border border-border bg-surface p-5">
        <div className="flex items-center gap-2.5 text-[13px] text-text-muted">
          <Loader2 className="size-3.5 animate-spin text-brand" />
          Reading finances.belgium.be — annual listing requirements
          <span className="ml-auto tabular-nums text-text-faint">{progress}%</span>
        </div>

        {/* Skeleton rows matching the real layout, not a spinner in a void. */}
        <ul className="mt-5 space-y-4" aria-hidden>
          {[0, 1, 2].map((i) => (
            <li key={i} className="flex items-start gap-4">
              <span className="h-3 w-32 shrink-0 rounded bg-border" />
              <span className="flex-1 space-y-2">
                <span
                  className="block h-3 rounded bg-border"
                  style={{ width: `${70 - i * 14}%` }}
                />
                <span
                  className="block h-3 rounded bg-border/60"
                  style={{ width: `${48 - i * 10}%` }}
                />
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
