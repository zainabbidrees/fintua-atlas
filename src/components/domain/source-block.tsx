"use client";

import * as React from "react";
import {
  ArrowUpRight,
  File,
  FileCode,
  FileSpreadsheet,
  FileText,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Where something came from, drawn as the document it is.
 *
 * An expert judges evidence by its artefact first — a PDF from the authority
 * and a blog post are not weighed the same — so the block leads with the thing
 * itself: the file's own icon when the source is a document, the site's own
 * favicon when it is a page. Favicons are fetched from the source's own domain,
 * never a third-party icon service, and fall back to a mark when absent.
 */

const EXTENSION_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  pdf: FileText,
  doc: FileText,
  docx: FileText,
  txt: FileText,
  rtf: FileText,
  xls: FileSpreadsheet,
  xlsx: FileSpreadsheet,
  csv: FileSpreadsheet,
  xml: FileCode,
  xsd: FileCode,
  json: FileCode,
};

/** The extension, when the thing being linked is a file rather than a page. */
function extensionOf(target: string): string | null {
  const path = target.split(/[?#]/)[0] ?? "";
  const match = /\.([a-z0-9]{2,5})$/i.exec(path);
  const ext = match?.[1]?.toLowerCase();
  return ext && ext in EXTENSION_ICON ? ext : null;
}

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

export function SourceBlock({
  url,
  title,
  /** Lines under the title: what kind of source it is, when it was updated. */
  meta,
  /** Overrides the URL when the artefact is an upload, e.g. "return-2026.pdf". */
  fileName,
  className,
}: {
  url: string;
  title: string;
  meta?: (string | null | undefined)[];
  fileName?: string;
  className?: string;
}) {
  const extension = extensionOf(fileName ?? url);
  const host = extension ? null : hostOf(url);
  const lines = (meta ?? []).filter(Boolean) as string[];

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group/source flex h-full items-start gap-3 rounded-lg bg-wash p-3 transition-colors hover:bg-surface",
        className,
      )}
    >
      <SourceMark extension={extension} host={host} />

      <span className="min-w-0 flex-1">
        {/* Reads as a link by default — brand and underlined — not only on
            hover; the underline strengthens on hover and the arrow stays bare. */}
        <span className="flex items-center gap-1 text-[15px] font-medium text-brand transition-colors group-hover/source:text-brand-hover">
          <span className="truncate underline decoration-brand/40 underline-offset-2 group-hover/source:decoration-brand">
            {title}
          </span>
          <ArrowUpRight className="size-4 shrink-0" />
        </span>

        {/* Stacked, not joined by a middot: two short lines fit the column and
            cost no height — the mark beside them is already two lines tall. */}
        {lines.map((line) => (
          <span key={line} className="mt-0.5 block truncate text-[13px] text-text-muted" data-numeric>
            {line}
          </span>
        ))}
      </span>
    </a>
  );
}

/** The artefact's own mark: a file-type glyph, or the site's favicon. */
function SourceMark({
  extension,
  host,
}: {
  extension: string | null;
  host: string | null;
}) {
  const [faviconFailed, setFaviconFailed] = React.useState(false);
  const Icon = extension ? (EXTENSION_ICON[extension] ?? File) : Globe;

  return (
    <span className="grid size-9 shrink-0 place-items-center rounded-md bg-[#efefef]">
      {host && !faviconFailed ? (
        // A plain img: the host is arbitrary and unknown at build time, and a
        // broken favicon has to fall back rather than throw.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`https://${host}/favicon.ico`}
          alt=""
          width={16}
          height={16}
          className="size-4 object-contain"
          onError={() => setFaviconFailed(true)}
        />
      ) : (
        <Icon className="size-4 text-text-faint" />
      )}

      {extension && (
        <span className="sr-only">{extension.toUpperCase()} document</span>
      )}
    </span>
  );
}
