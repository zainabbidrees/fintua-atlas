"use client";

import * as React from "react";
import { Paperclip, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";

/**
 * One input for "I know something you don't", taking either a file or a link.
 *
 * The prototype had these as two separate features — an Uploads dropzone and an
 * Add URL field. They answer the same need, so they're one control. A file
 * carries more weight in practice: the expert's most valuable material (a form
 * behind a login, a completed example return, an advisor's email) has no public
 * URL to point at.
 */
export function AddFileOrLink({
  heading,
  hint,
  chooseLabel,
  linkPlaceholder,
  linkInvalidMessage,
  accept,
  disabled,
  onFile,
  onLink,
  className,
}: {
  heading: string;
  hint: string;
  chooseLabel: string;
  linkPlaceholder: string;
  linkInvalidMessage: string;
  accept: string;
  disabled?: boolean;
  onFile: (file: File) => void;
  onLink: (url: string) => void;
  className?: string;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);
  const [link, setLink] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  function submitLink() {
    const value = link.trim();
    if (!value) return;
    try {
      const parsed = new URL(value);
      if (!/^https?:$/.test(parsed.protocol)) throw new Error("scheme");
      onLink(parsed.toString());
      setLink("");
      setError(null);
    } catch {
      setError(linkInvalidMessage);
    }
  }

  return (
    <section className={className}>
      <h3 className="text-sm font-medium text-heading">{heading}</h3>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) onFile(file);
        }}
        className={cn(
          "mt-2 rounded-lg border border-dashed p-4 transition-colors",
          dragging ? "border-brand bg-brand-quiet" : "border-border-strong bg-surface",
        )}
      >
        <p className="text-sm text-text-muted">{hint}</p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
          >
            <Paperclip />
            {chooseLabel}
          </Button>

          <span className="text-xs text-text-faint">or</span>

          <div className="flex min-w-[16rem] flex-1 items-center gap-2">
            <Input
              value={link}
              disabled={disabled}
              aria-invalid={error ? true : undefined}
              onChange={(e) => {
                setLink(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submitLink();
                }
              }}
              placeholder={linkPlaceholder}
              className="h-8 text-[13px]"
            />
            <Button
              size="sm"
              variant="ghost"
              disabled={disabled || !link.trim()}
              onClick={submitLink}
              aria-label="Add link"
            >
              <Link2 />
            </Button>
          </div>
        </div>

        {error && <p className="mt-2 text-xs text-risk">{error}</p>}

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFile(file);
            e.target.value = "";
          }}
        />
      </div>
    </section>
  );
}
