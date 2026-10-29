import * as React from "react";
import type { FormBlock, FormEdition, FormPage } from "@/lib/types";

/** A4 at 96 dpi. The sheet is drawn at this size once, then scaled to fit —
 *  so a thumbnail, the viewer and the printed PDF are the same drawing. */
export const SHEET_W = 794;
export const SHEET_H = 1123;

/* The printed form's own inks — the document's content, not the app's colour
   system — so they are fixed values rather than tokens. A neutral black on
   white with a pale grey for headed areas, as the Belgian forms print. */
const INK = "#1f2328";
const RULE = "#a3a9b0";
const TINT = "#eef0f2";

/**
 * One page of an official return form, as a facsimile.
 *
 * A stand-in for the retrieved PDF page (see src/lib/mock/tax-forms.ts), drawn
 * from the blocks the agent read off it: the masthead, the identification
 * boxes, the numbered grids, the listing tables and the explanatory notes.
 */
export function FormSheet({
  edition,
  page,
  pageNumber,
}: {
  edition: FormEdition;
  page: FormPage;
  pageNumber: number;
}) {
  const total = edition.pages.length;
  const code = edition.reference.replace(/^\D+/, "");

  return (
    <div
      lang="fr"
      className="flex flex-col bg-white text-left"
      style={{
        width: SHEET_W,
        height: SHEET_H,
        padding: "44px 56px 36px",
        color: INK,
      }}
    >
      {/* Running head on every page: the administration and the form number. */}
      <div
        className="flex items-end justify-between pb-2 text-[11px] font-semibold uppercase tracking-[0.08em]"
        style={{ borderBottom: `2px solid ${INK}` }}
      >
        <span>SPF Finances · TVA</span>
        <span className="tabular-nums">
          {code} · {pageNumber}/{total}
        </span>
      </div>

      <div className="mt-6 flex flex-1 flex-col gap-6">
        {page.blocks.map((block, i) => (
          <Block key={i} block={block} />
        ))}
      </div>

      <div
        className="flex justify-between pt-3 text-[10.5px]"
        style={{ borderTop: `1px solid ${RULE}`, color: "#5b636b" }}
      >
        <span>{edition.title}</span>
        <span>{edition.reference} · {edition.edition}</span>
      </div>
    </div>
  );
}

function Block({ block }: { block: FormBlock }) {
  switch (block.kind) {
    case "masthead":
      return (
        <div className="flex items-start justify-between gap-8">
          <div>
            <p className="text-[30px] font-bold leading-[1.1] tracking-[-0.01em]">
              {block.title}
            </p>
            <p className="mt-2 text-[13px]" style={{ color: "#5b636b" }}>
              {block.subtitle}
            </p>
          </div>
          <div
            className="shrink-0 px-4 py-2 text-center"
            style={{ border: `2px solid ${INK}` }}
          >
            <span className="block text-[10px] font-semibold uppercase tracking-[0.08em]">
              Formulaire
            </span>
            <span className="block text-[28px] font-bold leading-none tabular-nums">
              {block.reference}
            </span>
          </div>
        </div>
      );

    case "identity":
      return (
        <section>
          <Heading>I. Identification</Heading>
          <div className="mt-3 grid grid-cols-2 gap-x-5 gap-y-3">
            {block.fields.map((field, i) => (
              <div key={field} className={i === 2 ? "col-span-2" : undefined}>
                <span className="block text-[11px]">{field}</span>
                <span
                  className="mt-1 block h-[30px]"
                  style={{ border: `1px solid ${RULE}` }}
                />
              </div>
            ))}
          </div>
        </section>
      );

    case "frame":
      return (
        <section>
          <Heading>{block.title}</Heading>
          <div className="mt-1">
            {block.grids.map((grid) => (
              <div
                key={grid.code}
                className="flex items-center gap-4 py-[7px]"
                style={{ borderBottom: `1px solid ${TINT}` }}
              >
                <span className="min-w-0 flex-1 text-[12.5px] leading-snug">
                  {grid.label}
                </span>
                <span
                  className="flex h-[26px] w-[38px] shrink-0 items-center justify-center text-[13px] font-bold tabular-nums"
                  style={{ background: INK, color: "white" }}
                >
                  {grid.code}
                </span>
                <AmountComb />
              </div>
            ))}
          </div>
        </section>
      );

    case "table":
      return (
        <section>
          <Heading>{block.title}</Heading>
          <div className="mt-3" style={{ border: `1px solid ${RULE}` }}>
            <div
              className="grid text-[11px] font-semibold"
              style={{
                gridTemplateColumns: `28px repeat(${block.columns.length}, minmax(0, 1fr))`,
                background: TINT,
                borderBottom: `1px solid ${RULE}`,
              }}
            >
              <span className="px-2 py-2">N°</span>
              {block.columns.map((col) => (
                <span key={col} className="px-2 py-2" style={{ borderLeft: `1px solid ${RULE}` }}>
                  {col}
                </span>
              ))}
            </div>
            {Array.from({ length: block.rows }, (_, r) => (
              <div
                key={r}
                className="grid h-[25px]"
                style={{
                  gridTemplateColumns: `28px repeat(${block.columns.length}, minmax(0, 1fr))`,
                  borderTop: r ? `1px solid ${TINT}` : undefined,
                }}
              >
                <span className="px-2 text-[10px] leading-[25px] tabular-nums" style={{ color: "#5b636b" }}>
                  {r + 1}
                </span>
                {block.columns.map((col) => (
                  <span key={col} style={{ borderLeft: `1px solid ${TINT}` }} />
                ))}
              </div>
            ))}
          </div>
        </section>
      );

    case "prose":
      return (
        <section>
          <Heading>{block.title}</Heading>
          <div className="mt-3 columns-2 gap-7 text-[12.5px] leading-[1.6]">
            {block.paragraphs.map((p, i) => (
              <p key={i} className="mb-3 break-inside-avoid">
                {p}
              </p>
            ))}
          </div>
        </section>
      );

    case "signature":
      return (
        <section className="mt-auto">
          <span className="block text-[11px]">{block.label}</span>
          <div className="mt-2 grid grid-cols-[180px_minmax(0,1fr)] gap-5">
            <span className="block h-[54px]" style={{ border: `1px solid ${RULE}` }} />
            <span className="block h-[54px]" style={{ border: `1px solid ${RULE}` }} />
          </div>
        </section>
      );
  }
}

/** A frame's title on a solid band, as the form sets each cadre. */
function Heading({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="px-2.5 py-[5px] text-[12.5px] font-bold uppercase tracking-[0.04em]"
      style={{ background: TINT, borderLeft: `4px solid ${INK}` }}
    >
      {children}
    </p>
  );
}

/** The white digit cells for an amount: ten for the euros, two for the cents. */
function AmountComb() {
  const cell = (key: number) => (
    <span
      key={key}
      className="block h-[24px] w-[15px] bg-white"
      style={{ border: `1px solid ${RULE}` }}
    />
  );
  return (
    <span className="flex shrink-0 items-end gap-[2px]">
      {Array.from({ length: 10 }, (_, i) => cell(i))}
      <span className="px-[2px] text-[14px] font-bold leading-none">,</span>
      {cell(10)}
      {cell(11)}
    </span>
  );
}
