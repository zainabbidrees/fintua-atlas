"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * Draws a fixed-size child at whatever width its container gives it.
 *
 * The child is laid out once at its natural `width` × `height` and scaled with
 * a transform, so a page drawn for print reads the same as a thumbnail or in a
 * viewer — proportions and line breaks never reflow. The box holds the aspect
 * ratio itself, so nothing jumps while the first measurement lands; the child
 * stays hidden until then rather than flashing at full size.
 */
export function ScaleToFit({
  width,
  height,
  className,
  children,
}: {
  width: number;
  height: number;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(0);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);

  return (
    <div
      ref={ref}
      className={cn("relative w-full overflow-hidden", className)}
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{
          width,
          height,
          transform: `scale(${scale})`,
          visibility: scale ? "visible" : "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
}
