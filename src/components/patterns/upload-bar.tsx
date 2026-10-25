"use client";

import * as React from "react";
import { Paperclip, Link2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { copy } from "@/lib/copy";
import { cn } from "@/lib/cn";

/**
 * A slim upload bar that sits under a listing.
 *
 * The same intent as {@link AddFileOrLink} — take a file or a link that the
 * listing above doesn't already hold — compressed to a single strip so it reads
 * as a quiet addendum to the list rather than a panel of its own. It drops onto
 * the bar, pastes a link, keeps what it took as removable chips, and says so
 * when a link isn't a web address. Self-contained: a page adds the bar and
 * nothing else.
 */
type Attached = { id: string; label: string; kind: "file" | "link" };

/** PDF, XML, XSD, CSV, XLS, XLSX or TXT — the material a specialist actually holds. */
const DEFAULT_ACCEPT = ".pdf,.xml,.xsd,.csv,.xls,.xlsx,.txt";

export function UploadBar({
  className,
  accept = DEFAULT_ACCEPT,
}: {
  className?: string;
  accept?: string;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);
  const [link, setLink] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [attached, setAttached] = React.useState<Attached[]>([]);

  function addFile(file: File) {
    setAttached((a) => [
      ...a,
      { id: `${Date.now()}-${file.name}`, label: file.name, kind: "file" },
    ]);
    setError(null);
  }

  function addLink() {
    const value = link.trim();
    if (!value) return;
    try {
      const url = new URL(value);
      if (!/^https?:$/.test(url.protocol)) throw new Error("scheme");
      setAttached((a) => [
        ...a,
        { id: `${Date.now()}-${value}`, label: url.hostname, kind: "link" },
      ]);
      setLink("");
      setError(null);
    } catch {
      setError(copy.uploadBar.linkInvalid);
    }
  }

  return (
    <section className={className} aria-label={copy.uploadBar.label}>
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
          if (file) addFile(file);
        }}
        className={cn(
          "flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border px-2.5 py-2 transition-colors",
          dragging
            ? "border-dashed border-brand bg-brand-quiet"
            : "border-border-strong bg-surface",
        )}
      >
        {/* The file is the heavier action, so it leads. */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2 text-[13px] font-medium text-text transition-[background-color,transform] hover:bg-surface-sunken active:scale-[0.98]"
        >
          <Paperclip className="size-4 text-text-muted" />
          {copy.uploadBar.attach}
        </button>

        <span aria-hidden className="h-5 w-px shrink-0 bg-border" />

        {/* The bar carries the border, so the field inside is bare. */}
        <div className="relative flex min-w-[12rem] flex-1 items-center">
          <Link2
            aria-hidden
            className="pointer-events-none absolute left-2 size-4 text-text-muted"
          />
          <Input
            value={link}
            aria-invalid={error ? true : undefined}
            aria-label={copy.uploadBar.linkPlaceholder}
            onChange={(e) => {
              setLink(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addLink();
              }
            }}
            placeholder={copy.uploadBar.linkPlaceholder}
            className="h-8 border-0 bg-transparent pl-7 pr-2 text-[13px] shadow-none focus-visible:ring-0"
          />
        </div>

        <Button
          size="sm"
          variant="secondary"
          disabled={!link.trim()}
          onClick={addLink}
          className="shrink-0"
        >
          {copy.uploadBar.add}
        </Button>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) addFile(file);
            e.target.value = "";
          }}
        />
      </div>

      {error && <p className="mt-1.5 text-[12px] text-risk">{error}</p>}

      {attached.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-2">
          {attached.map((a) => (
            <li
              key={a.id}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-sunken px-2 py-1 text-[12px] text-text-muted"
            >
              {a.kind === "file" ? (
                <Paperclip className="size-3 shrink-0 text-text-faint" />
              ) : (
                <Link2 className="size-3 shrink-0 text-text-faint" />
              )}
              <span className="max-w-[16rem] truncate">{a.label}</span>
              <button
                type="button"
                onClick={() =>
                  setAttached((list) => list.filter((x) => x.id !== a.id))
                }
                aria-label={`Remove ${a.label}`}
                className="grid size-4 place-items-center rounded text-text-faint transition-colors hover:text-text"
              >
                <X className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
