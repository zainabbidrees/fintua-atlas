import * as React from "react";
import { Wordmark } from "@/components/brand/logo";
import { cn } from "@/lib/cn";
import { copy } from "@/lib/copy";

/* The mark's own outline, in its 44-unit drawing grid (see LogoMark). */
const OUTER = "M0 0 H44 V44 L36 36 V8 H8 Z";
const INNER = "M1 17 H26 V42 L18 34 V25 H8 Z";

/* Echoes of the outer chevron, scaled out from its top-right corner like
   contour lines, each fainter than the last. */
const ECHOES = [1.45, 1.9, 2.35, 2.8, 3.25];

/* The drawn lines' weight, in the mark's own units — about 1.5px at the
   panel's usual size. Not a non-scaling stroke: that measures the dash in
   screen pixels, so pathLength stops matching and the traced lines finish
   broken into dashes. A contour scaled by k takes LINE / k, so every line
   keeps the same weight. */
const LINE = 0.24;

/* Scales a shape about the mark's top-right corner (44, 0). */
const about = (k: number) => `translate(44 0) scale(${k}) translate(-44 0)`;

/**
 * The deep panel beside the sign-in form, built from the logo rather than an
 * illustration: the mark set large on its own construction grid — the 44-unit
 * square it is drawn on, with the 45° guides its cuts follow — and its outer
 * chevron repeated outward as contour lines that trace themselves in once on
 * arrival. Flat deep surfaces and hairlines only: no gradient, no glow, and
 * nothing that keeps moving.
 *
 * Under it, one heading and one line on what the tool is for.
 */
export function BrandPanel({ className }: { className?: string }) {
  const t = copy.authPanel;

  return (
    <aside
      className={cn(
        "relative isolate flex-col justify-between overflow-hidden bg-deep px-12 py-10 xl:px-16 xl:py-12",
        className,
      )}
    >
      <svg
        aria-hidden
        viewBox="-112 -16 172 172"
        className="pointer-events-none absolute right-0 top-0 -z-10 h-[118%] max-h-[1100px] w-auto"
      >
        <defs>
          <pattern
            id="mark-grid"
            width="4"
            height="4"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M4 0 H0 V4"
              fill="none"
              stroke="var(--deep-border)"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          </pattern>
        </defs>

        {/* The construction square, gridded, with the 45° guides — first,
            like the sheet a mark is drafted on. */}
        <g className="mark-fade" style={{ "--delay": "0ms" } as React.CSSProperties}>
          <rect
            x="0"
            y="0"
            width="44"
            height="44"
            fill="url(#mark-grid)"
            opacity="0.9"
          />
          <path
            d="M0 0 L44 44 M8 8 L36 36 M8 25 L26 43"
            fill="none"
            stroke="var(--deep-border)"
            strokeWidth="1"
            strokeDasharray="2 3"
            vectorEffect="non-scaling-stroke"
            opacity="0.8"
          />
        </g>

        {/* Contours, outermost faintest — they ripple out once the mark
            has landed. */}
        {ECHOES.map((k, i) => (
          <path
            key={k}
            d={OUTER}
            transform={about(k)}
            pathLength={1}
            fill="none"
            stroke="var(--deep-text-faint)"
            strokeWidth={LINE / k}
            strokeLinejoin="miter"
            opacity={0.75 - i * 0.1}
            className="mark-trace"
            style={{ "--index": i, "--delay": "850ms" } as React.CSSProperties}
          />
        ))}

        {/* The mark itself: the outer chevron outlined, then raised off the
            deep; the inner one in the brand colour slides into its corner. */}
        <path
          d={OUTER}
          fill="var(--deep-raised)"
          className="mark-fade"
          style={{ "--delay": "450ms" } as React.CSSProperties}
        />
        <path
          d={OUTER}
          pathLength={1}
          fill="none"
          stroke="var(--deep-text-faint)"
          strokeWidth={LINE * 1.25}
          opacity="0.85"
          className="mark-trace"
          style={{ "--delay": "100ms", "--duration": "0.6s" } as React.CSSProperties}
        />
        <path
          d={INNER}
          fill="var(--brand)"
          className="mark-slide"
          style={{ "--delay": "600ms" } as React.CSSProperties}
        />
      </svg>

      <div className="rise" style={{ "--index": 0 } as React.CSSProperties}>
        <Wordmark tone="on-deep" />
      </div>

      <div>
        <h2
          className="rise max-w-[30rem] text-[30px] font-medium leading-[1.15] tracking-tight text-on-deep xl:text-[34px]"
          style={{ "--index": 3 } as React.CSSProperties}
        >
          {t.title}
        </h2>
        <p
          className="rise mt-4 max-w-[40ch] text-[15px] leading-relaxed text-deep-text"
          style={{ "--index": 5 } as React.CSSProperties}
        >
          {t.subtitle}
        </p>
      </div>
    </aside>
  );
}
