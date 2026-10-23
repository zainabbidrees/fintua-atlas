import { SpecsSkeleton } from "@/features/rules/specs-skeleton";

/**
 * Next builds the segment's Suspense boundary from this file, which lets the
 * shell prerender while `params` resolves at runtime.
 */
export default function Loading() {
  return <SpecsSkeleton />;
}
