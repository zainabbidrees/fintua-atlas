import { cn } from "@/lib/cn";

/**
 * The Fintua mark.
 *
 * Traced from the supplied artwork (public/brand/fintua-logo.png) on a 44-unit
 * grid and verified against it pixel by pixel — two nested chevron forms, each
 * cut at 45° on its leading edge. Drawn rather than placed as an image so it
 * takes currentColor and sits correctly on both the light surfaces and the
 * deep sidebar.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 44 44"
      fill="currentColor"
      aria-hidden
      className={cn("size-6", className)}
    >
      <path d="M0 0 H44 V44 L36 36 V8 H8 Z" />
      <path d="M1 17 H26 V42 L18 34 V25 H8 Z" />
    </svg>
  );
}

/**
 * Mark plus wordmark. "FINTUA" is the brand, set in caps as the artwork does;
 * "Atlas" is this product, carried in a lighter weight so the lockup reads as
 * one company and one tool rather than a single compound name.
 */
export function Wordmark({
  className,
  tone = "default",
}: {
  className?: string;
  tone?: "default" | "on-deep";
}) {
  const onDeep = tone === "on-deep";

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className={onDeep ? "text-on-deep" : "text-brand"} />
      <span className="flex items-baseline gap-1.5">
        <span
          className={cn(
            "text-[15px] font-bold uppercase tracking-[-0.01em]",
            onDeep ? "text-on-deep" : "text-text",
          )}
        >
          Fintua
        </span>
        <span
          className={cn(
            "text-[15px] font-normal tracking-tight",
            onDeep ? "text-deep-text-faint" : "text-text-muted",
          )}
        >
          Atlas
        </span>
      </span>
    </span>
  );
}
