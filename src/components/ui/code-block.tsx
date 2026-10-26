"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * A read-only code surface with line numbers.
 *
 * Highlighting is deliberately quiet — keywords carry weight, strings and
 * numbers recede, comments fade — because the meaningful colour on this screen
 * is reserved for findings. A line a finding anchors to is tinted in that
 * finding's own tone, so the report and the code read as one thing. `ui/` knows
 * nothing about what the code is for; it only draws it.
 */

const KEYWORDS = new Set([
  "INSERT", "INTO", "VALUES", "UPDATE", "SET", "WHERE", "AND", "OR", "SELECT",
  "FROM", "CREATE", "TABLE", "ALTER", "DROP", "ADD", "COLUMN", "NULL", "TRUE",
  "FALSE", "AS", "ON", "NOT", "DEFAULT", "PRIMARY", "KEY", "REFERENCES",
  "COALESCE", "ROUND", "GREATEST", "LEAST", "CASE", "WHEN", "THEN", "ELSE", "END",
]);

const LINE_TONE: Record<NonNullable<CodeBlockProps["marks"]>[number], string> = {
  attention: "bg-attention-quiet shadow-[inset_2px_0_0_var(--attention)]",
  risk: "bg-risk-quiet shadow-[inset_2px_0_0_var(--risk)]",
  settled: "bg-settled-quiet shadow-[inset_2px_0_0_var(--settled)]",
};

interface CodeBlockProps {
  code: string;
  /** 1-based line number → the tone to tint it, for lines a finding points at. */
  marks?: Record<number, "attention" | "risk" | "settled">;
  className?: string;
}

export function CodeBlock({ code, marks, className }: CodeBlockProps) {
  const lines = code.replace(/\n$/, "").split("\n");

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-surface-sunken",
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse font-mono text-[12px] leading-[1.7]">
          <tbody>
            {lines.map((line, i) => {
              const n = i + 1;
              const tone = marks?.[n];
              return (
                <tr key={n} className={cn("align-top", tone && LINE_TONE[tone])}>
                  <td
                    className="w-[1%] select-none whitespace-nowrap py-px pl-3 pr-4 text-right text-text-faint"
                    data-numeric
                  >
                    {n}
                  </td>
                  <td className="whitespace-pre py-px pr-4">
                    {tokenize(line).map((t, j) => (
                      <span key={j} className={t.cls}>
                        {t.text}
                      </span>
                    ))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Splits one line into coloured tokens. A comment runs to the end of the line. */
function tokenize(line: string): { text: string; cls: string }[] {
  const tokens: { text: string; cls: string }[] = [];

  const commentAt = line.indexOf("--");
  const body = commentAt >= 0 ? line.slice(0, commentAt) : line;
  const comment = commentAt >= 0 ? line.slice(commentAt) : "";

  const re =
    /('(?:[^']|'')*')|(\d+(?:\.\d+)?)|([A-Za-z_][A-Za-z0-9_]*)|(\s+)|([^\sA-Za-z0-9_']+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    if (m[1]) tokens.push({ text: m[1], cls: "text-text-muted" });
    else if (m[2]) tokens.push({ text: m[2], cls: "text-text-muted" });
    else if (m[3]) {
      const keyword = KEYWORDS.has(m[3].toUpperCase());
      tokens.push({ text: m[3], cls: keyword ? "font-medium text-text" : "text-text" });
    } else if (m[4]) tokens.push({ text: m[4], cls: "" });
    else if (m[5]) tokens.push({ text: m[5], cls: "text-text-faint" });
  }

  if (comment) tokens.push({ text: comment, cls: "italic text-text-faint" });
  return tokens;
}
