"use client";

import * as React from "react";

/**
 * Whether the work on screen can be changed. A reviewer reads a step exactly
 * as it was built, so every control that edits — add, edit, duplicate, delete,
 * tick, generate — asks this and steps aside, while everything that only
 * looks (tabs, filters, page viewers, exports) stays.
 */
const ReadOnlyContext = React.createContext(false);

export function ReadOnly({ value, children }: { value: boolean; children: React.ReactNode }) {
  return <ReadOnlyContext.Provider value={value}>{children}</ReadOnlyContext.Provider>;
}

export function useReadOnly(): boolean {
  return React.useContext(ReadOnlyContext);
}
