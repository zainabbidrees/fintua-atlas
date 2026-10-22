"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wordmark } from "@/components/brand/logo";

/**
 * Prototype sign-in. No real authentication: nothing is sent anywhere and
 * nothing is stored — submitting simply moves to the app so the flow can be
 * reviewed end to end. Wire to the real identity provider before any use.
 */
export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const isSignup = mode === "signup";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setTimeout(() => router.push("/countries"), 450);
  }

  return (
    <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
      <div className="mx-auto w-full max-w-sm">
        <div className="lg:hidden">
          <Wordmark />
        </div>

        <h1 className="mt-8 text-2xl font-semibold tracking-tight text-text lg:mt-0">
          {isSignup ? "Create your account" : "Sign in"}
        </h1>
        <p className="mt-1.5 text-sm text-text-muted">
          {isSignup
            ? "Use your Fintua work email."
            : "Welcome back. Pick up where you left off."}
        </p>

        <form onSubmit={submit} className="mt-8 space-y-4">
          {isSignup && (
            <Field label="Full name">
              <Input name="name" autoComplete="name" placeholder="Marco Rossi" required />
            </Field>
          )}

          <Field label="Work email">
            <Input
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@fintua.com"
              required
            />
          </Field>

          <Field
            label="Password"
            aside={
              !isSignup ? (
                <button
                  type="button"
                  className="text-xs font-medium text-brand hover:underline"
                >
                  Forgot?
                </button>
              ) : undefined
            }
          >
            <Input
              name="password"
              type="password"
              autoComplete={isSignup ? "new-password" : "current-password"}
              placeholder="••••••••"
              required
            />
            {isSignup && (
              <p className="mt-1.5 text-xs text-text-faint">
                At least 12 characters.
              </p>
            )}
          </Field>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={busy}
            className="w-full"
          >
            {busy ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                {isSignup ? "Create account" : "Sign in"}
                <ArrowRight />
              </>
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-text-muted">
          {isSignup ? "Already have an account? " : "No account yet? "}
          <Link
            href={isSignup ? "/login" : "/signup"}
            className="font-medium text-brand hover:underline"
          >
            {isSignup ? "Sign in" : "Create one"}
          </Link>
        </p>

        <p className="mt-10 rounded-md border border-border bg-surface-sunken px-3 py-2 text-center text-xs text-text-faint">
          Prototype — any details take you straight in.
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  aside,
  children,
}: {
  label: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="flex items-center justify-between">
        <span className="text-sm font-medium text-text">{label}</span>
        {aside}
      </span>
      <span className="mt-1.5 block">{children}</span>
    </label>
  );
}
