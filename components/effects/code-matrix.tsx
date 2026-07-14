"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * CodeMatrix — overlay estilo "Matrix" para areas escuras.
 * Variante densa do `CodeHacker`: caracteres menores, mais linhas,
 * cor verde-laranja (site original). Aparece no `group-hover` do pai.
 *
 * Pensado para sidebar (preta). Para areas claras use `CodeHacker`.
 */
export function CodeMatrix({
  className,
  lines = 22,
  charsPerLine = 22,
}: {
  className?: string;
  lines?: number;
  charsPerLine?: number;
}) {
  const [rows, setRows] = useState<string[]>([]);

  useEffect(() => {
    // Pool estilo terminal: alfanumerico + simbolos hacker.
    const pool =
      "01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン" +
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789" +
      "!@#$%^&*()_+-={}[]<>?|<>~";
    const next: string[] = [];
    for (let i = 0; i < lines; i++) {
      let s = "";
      for (let j = 0; j < charsPerLine; j++) {
        s += pool[Math.floor(Math.random() * pool.length)];
      }
      next.push(s);
    }
    setRows(next);
  }, [lines, charsPerLine]);

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden font-mono text-[9px] leading-[1.1] text-brand/40 transition-opacity duration-300",
        "opacity-0 group-hover:opacity-90",
        className,
      )}
    >
      <div className="animate-[scia-code-scroll_18s_linear_infinite] whitespace-pre p-2 leading-[1.1] break-all">
        {rows.length > 0 ? rows.join("\n") : "\n".repeat(lines)}
      </div>
    </div>
  );
}
