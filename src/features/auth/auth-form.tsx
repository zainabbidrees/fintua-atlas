"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wordmark } from "@/components/brand/logo";
import { cn } from "@/lib/cn";
import { PEOPLE, roleForEmail, setRole } from "@/lib/session";

/**
 * Prototype sign-in. Nothing is validated, sent or stored — anything you type
 * lets you through, so the rest of the flow can be reviewed without friction.
 *
 * Validation and error states belong with the real identity provider; they go
 * in here when it's wired up.
 */
export function AuthForm() {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  /* Prefilled, since nothing is checked: one click signs in. */
  const [email, setEmail] = React.useState(PEOPLE.expert.email);

  /* The account decides the role — a tax expert builds and edits; a reviewer
     reads, comments and approves, starting from the Approvals list. Sign-in
     never asks: in the product the Comply SSO carries it. */
  function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    const role = roleForEmail(email);
    setRole(role);
    setTimeout(() => router.push(role === "reviewer" ? "/approvals" : "/countries"), 400);
  }

  return (
    <div className="flex flex-col">
      {/* On a wide screen the brand panel carries the wordmark. */}
      <div className="rise lg:hidden" style={{ "--index": 0 } as React.CSSProperties}>
        <Wordmark />
      </div>

      <h1
        className="rise mt-9 text-[22px] font-medium tracking-tight text-heading lg:mt-0"
        style={{ "--index": 1 } as React.CSSProperties}
      >
        Sign in
      </h1>
      <p
        className="rise mt-1 text-sm text-text-muted"
        style={{ "--index": 2 } as React.CSSProperties}
      >
        Country onboarding for Comply.
      </p>

      <form onSubmit={submit} className="mt-8 flex flex-col gap-4">
        <div
          className="rise flex flex-col gap-2"
          style={{ "--index": 3 } as React.CSSProperties}
        >
          <label htmlFor="email" className="text-sm font-medium text-text">
            Work email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@fintua.com"
          />
        </div>

        <div
          className="rise flex flex-col gap-2"
          style={{ "--index": 4 } as React.CSSProperties}
        >
          <div className="flex items-baseline justify-between">
            <label htmlFor="password" className="text-sm font-medium text-text">
              Password
            </label>
            <button
              type="button"
              className="text-xs font-medium text-text-muted transition-colors hover:text-text"
            >
              Forgot it?
            </button>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            defaultValue="prototype"
            placeholder="••••••••"
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={busy}
          className={cn("rise mt-2 w-full", busy && "cursor-wait")}
          style={{ "--index": 5 } as React.CSSProperties}
        >
          {busy ? (
            <>
              <Loader2 className="animate-spin" />
              Signing in
            </>
          ) : (
            <>
              Sign in
              <ArrowRight />
            </>
          )}
        </Button>
      </form>

      <p
        className="rise mt-10 text-center text-xs leading-relaxed text-text-faint"
        style={{ "--index": 6 } as React.CSSProperties}
      >
        Internal tool. Access is managed by your administrator.
        <br />
        <span className="text-text-faint/80">Prototype — anything signs in.</span>
      </p>
    </div>
  );
}
