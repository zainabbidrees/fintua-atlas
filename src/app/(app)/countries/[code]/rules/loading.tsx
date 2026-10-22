import { ReturnsSkeleton } from "@/features/returns/returns-skeleton";

/**
 * Next builds the segment's Suspense boundary from this file, which lets the
 * shell prerender while `params` resolves at runtime.
 */
export default function Loading() {
  return <ReturnsSkeleton />;
}
