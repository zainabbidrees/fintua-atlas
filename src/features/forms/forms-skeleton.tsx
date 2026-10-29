/**
 * Prerendered placeholder while the route's params resolve.
 *
 * Shaped like the real screen — a section per form, each a strip of pages —
 * so the swap reads as content arriving rather than the layout rebuilding.
 */
export function FormsSkeleton() {
  return (
    <div className="pb-24" aria-busy>
      <div className="border-b border-border bg-surface px-6 pt-8 sm:px-12">
        <div className="mx-auto w-full max-w-[1600px]">
          <span className="block h-3 w-24 rounded bg-border" />
          <span className="mt-4 block h-6 w-40 rounded bg-border" />
          <div className="mt-6 flex gap-2 pb-5">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <span key={i} className="h-9 w-32 rounded-lg bg-border/50" />
            ))}
          </div>
        </div>
      </div>

      <div className="px-6 py-8 sm:px-12">
        <div className="mx-auto w-full max-w-[1600px]">
          <span className="block h-5 w-40 rounded bg-border" />
          <span className="mt-3 block h-3 w-[min(36rem,100%)] rounded bg-border/60" />
          <div className="mt-6 space-y-6">
            {[0, 1].map((s) => (
              <div key={s} className="overflow-hidden rounded-xl border border-border bg-surface">
                <div className="space-y-2 border-b border-border px-5 py-4">
                  <span className="block h-4 w-36 rounded bg-border" />
                  <span className="block h-3 w-80 max-w-full rounded bg-border/60" />
                </div>
                <div className="grid grid-cols-2 gap-5 px-5 py-5 sm:grid-cols-[repeat(auto-fill,minmax(150px,1fr))]">
                  {[0, 1, 2, 3].map((i) => (
                    <span key={i} className="block aspect-[794/1123] rounded-[3px] bg-surface-sunken" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
