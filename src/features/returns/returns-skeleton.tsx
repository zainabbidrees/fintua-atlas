/**
 * Prerendered placeholder while the route's params resolve.
 *
 * Shaped like the real screen — rail on the left, grouped rows on the right —
 * so the swap reads as content arriving rather than the layout rebuilding.
 */
export function ReturnsSkeleton() {
  return (
    <div className="pb-24" aria-busy>
      <div className="border-b border-border bg-surface px-6 pt-8 sm:px-10">
        <div className="mx-auto w-full max-w-6xl">
          <span className="block h-3 w-20 rounded bg-border" />
          <span className="mt-4 block h-6 w-40 rounded bg-border" />
          <span className="mt-2 block h-3 w-28 rounded bg-border/60" />
          <div className="mt-6 flex gap-2 pb-5">
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} className="h-8 flex-1 rounded-lg bg-border/50" />
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-6 py-10 sm:px-10">
        <div className="grid gap-x-10 gap-y-8 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="block h-14 rounded-xl bg-border/50" />
            ))}
          </div>

          <div>
            <span className="block h-5 w-36 rounded bg-border" />
            <div className="mt-6 overflow-hidden rounded-xl border border-border bg-surface">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 border-b border-border px-5 py-5 last:border-0"
                >
                  <span className="h-3 w-32 shrink-0 rounded bg-border" />
                  <span
                    className="h-3 rounded bg-border/60"
                    style={{ width: `${54 - i * 8}%` }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
