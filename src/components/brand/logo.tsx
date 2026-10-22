import { cn } from "@/lib/cn";

/**
 * Placeholder mark — a stylised "A" for ATLAS built from three ascending bars,
 * echoing the wizard's progression. Swap for Fintua's real mark when we have it.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden
      className={cn("size-7", className)}
    >
      <rect x="2" y="17" width="6" height="9" rx="1.5" fill="currentColor" opacity="0.45" />
      <rect x="11" y="10" width="6" height="16" rx="1.5" fill="currentColor" opacity="0.72" />
      <rect x="20" y="2" width="6" height="24" rx="1.5" fill="currentColor" />
    </svg>
  );
}

export function Wordmark({
  className,
  tone = "default",
}: {
  className?: string;
  tone?: "default" | "on-deep";
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className={tone === "on-deep" ? "text-on-deep" : "text-brand"} />
      <span className="flex items-baseline gap-1.5">
        <span
          className={cn(
            "text-[17px] font-semibold tracking-tight",
            tone === "on-deep" ? "text-on-deep" : "text-text",
          )}
        >
          Fintua
        </span>
        <span
          className={cn(
            "text-[17px] font-light tracking-tight",
            tone === "on-deep" ? "text-deep-text-faint" : "text-text-muted",
          )}
        >
          Atlas
        </span>
      </span>
    </span>
  );
}

/**
 * A fine dot lattice for the deep panels. An SVG texture rather than a gradient
 * — it adds depth without the sheen the brand brief rules out.
 */
export function DotTexture({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 size-full", className)}
    >
      <defs>
        <pattern id="atlas-dots" width="22" height="22" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="1.5" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#atlas-dots)" />
    </svg>
  );
}
