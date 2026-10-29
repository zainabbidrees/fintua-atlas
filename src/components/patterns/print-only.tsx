"use client";

import * as React from "react";
import { createPortal } from "react-dom";

/**
 * Content that exists only on paper.
 *
 * Rendered straight under `<body>`, where the print stylesheet in globals.css
 * hides every sibling — so when the browser prints, this is the whole document
 * and the app around it is gone. On screen it is never shown.
 *
 * This is how "Export PDF" works without a PDF library: the browser's own Save
 * as PDF lays out exactly these sheets, one per printed page.
 */
export function PrintOnly({ children }: { children: React.ReactNode }) {
  // `document` exists only after hydration; the server renders nothing here.
  const mounted = React.useSyncExternalStore(noop, () => true, () => false);
  if (!mounted) return null;

  return createPortal(
    <div data-print-root className="hidden print:block">
      {children}
    </div>,
    document.body,
  );
}

const noop = () => () => {};

/**
 * Opens the browser's print dialog with `title` as the suggested file name,
 * then puts the page title back.
 */
export function printAs(title: string) {
  const previous = document.title;
  document.title = title;
  try {
    window.print();
  } finally {
    document.title = previous;
  }
}
