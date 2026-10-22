"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CircleAlert, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wordmark } from "@/components/brand/logo";
import { cn } from "@/lib/cn";

/**
 * Prototype sign-in. No real authentication: nothing leaves the browser and
 * nothing is stored. The domain check exists so the error path is reachable
 * during review — replace the whole submit handler when identity is wired up.
 */
const WORK_DOMAIN = "fintua.com";

export function AuthForm() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!email.toLowerCase().endsWith(`@${WORK_DOMAIN}`)) {
      setError(`Sign in with your @${WORK_DOMAIN} address.`);
      return;
    }
    if (password.length < 8) {
      setError("That password is too short.");
      return;
    }

    setBusy(true);
    setTimeout(() => router.push("/countries"), 500);
  }

  return (
    <div className="flex flex-col">
      <div className="rise" style={{ "--index": 0 } as React.CSSProperties}>
        <Wordmark />
      </div>

      <h1
        className="rise mt-9 text-[22px] font-semibold tracking-tight text-text"
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

      <form onSubmit={submit} noValidate className="mt-8 flex flex-col gap-4">
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
            autoFocus
            value={email}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "signin-error" : undefined}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
            }}
            placeholder={`you@${WORK_DOMAIN}`}
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
              className="text-xs font-medium text-text-muted transition-colors hover:text-brand"
            >
              Forgot it?
            </button>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            aria-invalid={error ? true : undefined}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(null);
            }}
            placeholder="••••••••"
          />
        </div>

        {/* Reserved space, so the form doesn't jump when an error appears. */}
        <div className="min-h-5" aria-live="polite">
          {error && (
            <p
              id="signin-error"
              className="flex items-start gap-1.5 text-sm text-risk"
            >
              <CircleAlert className="mt-0.5 size-3.5 shrink-0" />
              {error}
            </p>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={busy}
          className={cn("rise w-full", busy && "cursor-wait")}
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
        <span className="text-text-faint/80">
          Prototype — any @{WORK_DOMAIN} address signs in.
        </span>
      </p>
    </div>
  );
}
