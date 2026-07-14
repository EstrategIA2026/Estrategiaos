"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Overlay de codigo Estrateg[IA] — efeito hacker que aparece no hover.
 *
 * Reproduz o efeito da secao "EU MONTO PRA VOCE" do site Estrateg[IA]
 * original: caracteres de codigo rolando, em cores laranja, com um fade
 * sutil. Quando o pai fica em hover, o overlay ganha opacidade e o texto
 * comea a rolar.
 *
 * SSR-safe: o texto so e gerado no client (useEffect), evitando mismatch
 * de hidratacao entre servidor e navegador.
 */
export function CodeHacker({
  className,
  lines = 18,
  charsPerLine = 64,
}: {
  className?: string;
  /** Quantas linhas de codigo gerar. */
  lines?: number;
  /** Largura media de cada linha (em caracteres). */
  charsPerLine?: number;
}) {
  const [rows, setRows] = useState<string[]>([]);

  useEffect(() => {
    // Pool de caracteres estilo terminal hacker
    const pool =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789" +
      "!@#$%^&*()_+-={}[]<>?|;:,.//~`'\"";
    const next: string[] = [];
    for (let i = 0; i < lines; i++) {
      let s = "";
      const len = charsPerLine + Math.floor(Math.random() * 12) - 6;
      for (let j = 0; j < len; j++) {
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
        "pointer-events-none absolute inset-0 overflow-hidden font-mono text-[11px] leading-[1.5] text-brand/60 transition-opacity duration-500",
        "opacity-0 group-hover:opacity-100",
        className,
      )}
    >
      <div className="animate-[scia-code-scroll_22s_linear_infinite] whitespace-pre p-4 leading-[1.4]">
        {rows.length > 0 ? rows.join("\n") : "\n".repeat(lines)}
      </div>
      {/* Gradiente nas bordas para suavizar o efeito */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-card to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-card to-transparent" />
    </div>
  );
}
