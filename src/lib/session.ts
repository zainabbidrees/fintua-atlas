"use client";

import * as React from "react";

/**
 * Who is signed in. There is no identity provider yet, so the role chosen at
 * sign-in is kept in localStorage and read back wherever the view differs —
 * a tax expert builds and edits; a reviewer reads, comments and approves.
 */
export type Role = "expert" | "reviewer";

export interface Person {
  name: string;
  initials: string;
  role: Role;
}

/* The two people the prototype signs in as, one per role. */
export const PEOPLE: Record<Role, Person> = {
  expert: { name: "Marco Rossi", initials: "MR", role: "expert" },
  reviewer: { name: "Elena Fischer", initials: "EF", role: "reviewer" },
};

const KEY = "fintua:role";
const EVENT = "fintua:role-change";

export function readRole(): Role {
  try {
    return localStorage.getItem(KEY) === "reviewer" ? "reviewer" : "expert";
  } catch {
    return "expert";
  }
}

export function setRole(role: Role) {
  try {
    localStorage.setItem(KEY, role);
  } catch {
    /* storage unavailable — the app then treats everyone as the expert. */
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** The signed-in person; the expert on the server and before hydration. */
export function useSession(): Person {
  const role = React.useSyncExternalStore(subscribe, readRole, () => "expert" as Role);
  return PEOPLE[role];
}
