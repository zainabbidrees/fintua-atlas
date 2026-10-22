"use client";

import { FileText, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { copy, DOCUMENT_KIND_LABEL } from "@/lib/copy";
import type { UserDocument } from "@/lib/types";

/**
 * The expert's own material.
 *
 * Each document is typed on the way in, because the agent should read a
 * completed example return very differently from a guidance PDF — the
 * prototype treated every upload as an untyped blob.
 */
export function DocumentList({
  documents,
  onRemove,
}: {
  documents: UserDocument[];
  onRemove: (doc: UserDocument) => void;
}) {
  if (documents.length === 0) return null;

  return (
    <section className="mt-4">
      <h3 className="text-sm font-semibold text-text">{copy.documents.yours}</h3>
      <ul className="mt-2 space-y-2">
        {documents.map((doc) => (
          <li
            key={doc.id}
            className="group flex items-start justify-between gap-4 rounded-md border border-border bg-surface px-3 py-2.5"
          >
            <div className="flex min-w-0 gap-2.5">
              <FileText className="mt-0.5 size-4 shrink-0 text-text-faint" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-text">
                  {doc.fileName}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <Badge tone="brand">{DOCUMENT_KIND_LABEL[doc.kind]}</Badge>
                  <span className="text-xs text-text-faint" data-numeric>
                    {formatSize(doc.sizeBytes)}
                  </span>
                </div>
                {doc.note && (
                  <p className="mt-1.5 text-sm leading-relaxed text-text-muted">
                    {doc.note}
                  </p>
                )}
              </div>
            </div>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => onRemove(doc)}
              aria-label={`Remove ${doc.fileName}`}
              className="shrink-0 text-text-faint opacity-0 hover:text-risk focus-visible:opacity-100 group-hover:opacity-100"
            >
              <Trash2 />
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
