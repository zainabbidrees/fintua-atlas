/**
 * Prerendered placeholder while the route's params resolve.
 *
 * Shaped like the real screen — three stage nodes on the left, a table on the
 * right — so the swap reads as content arriving rather than the layout
 * rebuilding. Three nodes and not four: the count is part of the shape here,
 * since it is what tells the reader the step has parts at all.
 */
export function SpecsSkeleton() {
  return (
    <div className="pb-24" aria-busy>
      <div className="border-b border-border bg-surface px-6 pt-8 sm:px-12">
        <div className="mx-auto w-full max-w-[1600px]">
          <span className="block h-3 w-24 rounded bg-border" />
          <span className="mt-4 block h-6 w-40 rounded bg-border" />
          <div className="mt-6 flex gap-2 pb-5">
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} className="h-8 flex-1 rounded-lg bg-border/50" />
            ))}
          </div>
        </div>
      </div>

      <div className="px-6 py-8 sm:px-12">
        <div className="mx-auto w-full max-w-[1600px]">
          <div className="grid gap-x-10 gap-y-8 lg:grid-cols-[minmax(0,13.5rem)_minmax(0,1fr)]">
            <div className="space-y-2">
              <span className="block h-3 w-28 rounded bg-border" />
              <span className="block h-3 w-16 rounded bg-border/60" />
              <div className="space-y-1.5 pt-3">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="block h-14 rounded-xl bg-border/50" />
                ))}
              </div>
            </div>

            <div>
              <span className="block h-5 w-40 rounded bg-border" />
              <span className="mt-3 block h-3 w-full max-w-[40ch] rounded bg-border/60" />

              <div className="mt-7 flex items-center gap-6 border-b border-border pb-4">
                {[0, 1].map((i) => (
                  <span key={i} className="block h-3 w-20 rounded bg-border/60" />
                ))}
              </div>

              <div className="mt-6 space-y-px">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-6 border-b border-border py-4"
                  >
                    {[0, 1, 2, 3].map((j) => (
                      <span
                        key={j}
                        className="block h-3 rounded bg-border/60"
                        style={{ width: `${18 - j * 2 - i}%` }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
