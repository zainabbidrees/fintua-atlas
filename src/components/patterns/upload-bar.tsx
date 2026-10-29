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
 * listing above doesn't already hold. Two shapes from one component: the
 * default strip for a full-width footing, and a `stacked` card for a narrow
 * column (the returns rail), where a full-width drop target leads and the link
 * is the quieter second route beneath it. It drops a file, pastes a link, keeps
 * what it took as removable chips, and says so when a link isn't a web address.
 */
type Attached = { id: string; label: string; kind: "file" | "link" };

/** PDF, XML, XSD, CSV, XLS, XLSX or TXT — the material a specialist actually holds. */
const DEFAULT_ACCEPT = ".pdf,.xml,.xsd,.csv,.xls,.xlsx,.txt";

export function UploadBar({
  className,
  accept = DEFAULT_ACCEPT,
  stacked = false,
  emphasis = false,
  onAdd,
}: {
  className?: string;
  accept?: string;
  /** A vertical card for a narrow column, instead of the single-line strip. */
  stacked?: boolean;
  /**
   * A larger, amber-tinted treatment for the single-line strip — used where the
   * bar leads a step rather than sitting quietly beneath the work.
   */
  emphasis?: boolean;
  /**
   * When given, the bar reports each attachment up instead of keeping its own
   * chip list — so the owner can list them elsewhere (e.g. an "Uploaded by you"
   * group beside the findings). Without it, the bar shows its own chips.
   */
  onAdd?: (item: { label: string; kind: "file" | "link" }) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);
  const [link, setLink] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [attached, setAttached] = React.useState<Attached[]>([]);

  function addFile(file: File) {
    setError(null);
    if (onAdd) {
      onAdd({ label: file.name, kind: "file" });
      return;
    }
    setAttached((a) => [
      ...a,
      { id: `${Date.now()}-${file.name}`, label: file.name, kind: "file" },
    ]);
  }

  function addLink() {
    const value = link.trim();
    if (!value) return;
    try {
      const url = new URL(value);
      if (!/^https?:$/.test(url.protocol)) throw new Error("scheme");
      if (onAdd) {
        onAdd({ label: url.hostname, kind: "link" });
        setLink("");
        setError(null);
        return;
      }
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

  const linkField = (
    <div className="relative flex min-w-0 flex-1 items-center">
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
        className={cn(
          "border-0 bg-transparent pl-7 pr-2 shadow-none focus-visible:ring-0",
          emphasis ? "h-11 text-[15px]" : "h-8 text-[13px]",
        )}
      />
    </div>
  );

  const addButton = (
    <Button
      size={emphasis ? "lg" : "sm"}
      variant="secondary"
      disabled={!link.trim()}
      onClick={addLink}
      className="shrink-0"
    >
      {copy.uploadBar.add}
    </Button>
  );

  return (
    <section className={className} aria-label={copy.uploadBar.label}>
      {stacked ? (
        <div className="space-y-2">
          {/* Block one — attach a file: its own drop target. */}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
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
              "flex w-full items-center justify-center gap-2 rounded-xl border border-dashed py-7 text-[14px] font-medium text-text transition-colors",
              dragging
                ? "border-brand bg-brand-quiet"
                : "border-border-strong bg-wash hover:border-brand hover:bg-surface-sunken",
            )}
          >
            <Paperclip className="size-4 text-text-muted" />
            {copy.uploadBar.attach}
          </button>

          {/* Block two — paste a link, saved with its own Add button. */}
          <div className="flex items-center gap-2 rounded-xl border border-border-strong bg-surface p-2">
            {linkField}
            {addButton}
          </div>
        </div>
      ) : (
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
            "flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border transition-colors",
            emphasis ? "px-5 py-4" : "px-2.5 py-2",
            dragging
              ? "border-dashed border-brand bg-brand-quiet"
              : emphasis
                ? "border-attention-edge bg-surface"
                : "border-border-strong bg-surface",
          )}
        >
          {/* The file is the heavier action, so it leads. */}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 font-medium text-text transition-[background-color,transform] active:scale-[0.98]",
              emphasis
                ? "h-11 text-[15px] hover:bg-attention-quiet"
                : "h-8 text-[13px] hover:bg-wash",
            )}
          >
            <Paperclip className="size-4 text-text-muted" />
            {copy.uploadBar.attach}
          </button>

          <span
            aria-hidden
            className={cn(
              "w-px shrink-0",
              emphasis ? "h-7 bg-attention-edge" : "h-5 bg-border",
            )}
          />

          {linkField}
          {addButton}
        </div>
      )}

      {/* Out of the card so its screen-reader-only box adds no bottom gap. */}
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

      {error && <p className="mt-1.5 text-[12px] text-risk">{error}</p>}

      {attached.length > 0 && (
        <ul className="mt-2 space-y-2">
          {attached.map((a) => (
            <li
              key={a.id}
              className="flex w-full items-center gap-1.5 rounded-md border border-border bg-surface-sunken px-2 py-1 text-[12px] text-text-muted"
            >
              {a.kind === "file" ? (
                <Paperclip className="size-3 shrink-0 text-text-faint" />
              ) : (
                <Link2 className="size-3 shrink-0 text-text-faint" />
              )}
              <span className="min-w-0 flex-1 truncate">{a.label}</span>
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
