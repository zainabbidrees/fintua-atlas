"use client";

import { usePathname } from "next/navigation";
import { NavList } from "./nav-list";

/**
 * The only part of the sidebar that needs the current URL. Isolated so the
 * rest of the shell can prerender: under Next's cacheComponents, a client hook
 * reading URL data blocks prerendering unless it sits inside a Suspense
 * boundary of its own.
 */
export function ActiveNav() {
  return <NavList activePath={usePathname()} />;
}
