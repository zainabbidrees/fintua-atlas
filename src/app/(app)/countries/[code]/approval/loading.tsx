import { ReturnsSkeleton } from "@/features/returns/returns-skeleton";

/** Segment Suspense boundary, so the shell prerenders while params resolve. */
export default function Loading() {
  return <ReturnsSkeleton />;
}
