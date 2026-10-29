"use client";

import { ArrowUpRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReadOnly } from "@/components/patterns/read-only";
import {
  SourceMark,
  extensionOf,
  hostOf,
} from "@/components/domain/source-block";
import { copy } from "@/lib/copy";
import type { UserDocument } from "@/lib/types";

/**
 * The expert's own attached material, read back in the evidence language the
 * findings use: the artefact's own mark, then the thing itself. A source URL
 * reads as a link — favicon and all, opening in a new tab — and an uploaded
 * file as a file, named with its size. Either way the heading marks the lot as
 * the expert's, so it is never mistaken for something the agent retrieved.
 */
export function DocumentList({
  documents,
  onRemove,
}: {
  documents: UserDocument[];
  onRemove: (doc: UserDocument) => void;
}) {
  const readOnly = useReadOnly();
  if (documents.length === 0) return null;

  return (
    <section>
      <h3 className="text-sm font-medium text-heading">{copy.documents.yours}</h3>
      <ul className="mt-2 space-y-2">
        {documents.map((doc) => {
          const extension = extensionOf(doc.url ?? doc.fileName);
          const host = extension || !doc.url ? null : hostOf(doc.url);

          return (
            <li
              key={doc.id}
              className="group flex items-center gap-3 rounded-lg bg-[oklch(97.8%_0_0)] p-3"
            >
              <SourceMark extension={extension} host={host} />

              <div className="min-w-0 flex-1">
                {doc.url ? (
                  // A link opens; it reads as one — brand and underlined — the
                  // same as a source does.
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group/link flex items-center gap-1 text-[15px] font-medium text-brand transition-colors hover:text-brand-hover"
                  >
                    <span className="truncate underline decoration-brand/40 underline-offset-2 group-hover/link:decoration-brand">
                      {doc.fileName}
                    </span>
                    <ArrowUpRight className="size-4 shrink-0" />
                  </a>
                ) : (
                  // An uploaded file is held, not linked: named, not clickable.
                  <p className="truncate text-[15px] font-medium text-text">
                    {doc.fileName}
                  </p>
                )}

                <span className="mt-0.5 block truncate text-[13px] text-text-muted" data-numeric>
                  {doc.sizeBytes > 0
                    ? `${copy.documents.uploadedByYou} · ${formatSize(doc.sizeBytes)}`
                    : copy.documents.uploadedByYou}
                </span>
              </div>

              {!readOnly && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onRemove(doc)}
                aria-label={`Remove ${doc.fileName}`}
                className="shrink-0 text-text-faint transition-colors hover:text-risk"
              >
                <Trash2 />
              </Button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
