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
  /** Prefilled at sign-in, so the prototype signs in with one click. */
  email: string;
  role: Role;
}

/* The two people the prototype signs in as, one per role. */
export const PEOPLE: Record<Role, Person> = {
  expert: { name: "Marco Rossi", initials: "MR", email: "marco.rossi@fintua.com", role: "expert" },
  reviewer: {
    name: "Elena Fischer",
    initials: "EF",
    email: "elena.fischer@fintua.com",
    role: "reviewer",
  },
};

/**
 * The role an account carries. In the product this comes from the Comply SSO —
 * authorisation is the backend's, set per account — so sign-in never asks for
 * it. Here it stands in for that lookup: a known reviewer's email is the
 * reviewer, anyone else the tax expert.
 */
export function roleForEmail(email: string): Role {
  return email.trim().toLowerCase() === PEOPLE.reviewer.email ? "reviewer" : "expert";
}

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
