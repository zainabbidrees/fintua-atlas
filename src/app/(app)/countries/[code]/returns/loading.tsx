import { ReturnsSkeleton } from "@/features/returns/returns-skeleton";

/**
 * Next creates the segment's Suspense boundary from this file, which is what
 * lets the route prerender its shell while `params` resolves at runtime.
 */
export default function Loading() {
  return <ReturnsSkeleton />;
}
