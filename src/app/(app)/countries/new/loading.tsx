import { ReturnsSkeleton } from "@/features/returns/returns-skeleton";

/** Segment Suspense boundary, so the shell prerenders while the search params
    (`?review=`) resolve. */
export default function Loading() {
  return <ReturnsSkeleton />;
}
