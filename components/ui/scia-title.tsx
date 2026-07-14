import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Titulo com efeito glitch Estrateg[IA] (RGB-style no hover).
 *
 * O efeito precisa do atributo `data-text` identico ao conteudo do elemento.
 * Quando o children e uma string simples, populamos o data-text no server
 * (mesmo valor antes e depois da hidratacao, sem mismatch). Para children
 * JSX/variavel, o efeito glitch simplesmente nao fica tao preciso (o
 * data-text fica vazio), mas o titulo continua visualmente correto.
 *
 * Ver `.scia-glitch` em globals.css para a animacao.
 */
export function SciaTitle({
  as,
  className,
  children,
  ...props
}: {
  as?: "h1" | "h2" | "h3" | "h4";
  className?: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLElement>) {
  const Comp = (as ?? "h1") as React.ElementType;

  const sizeClass =
    as === "h1" || !as
      ? "text-4xl md:text-5xl"
      : as === "h2"
        ? "text-2xl md:text-3xl"
        : as === "h3"
          ? "text-lg md:text-xl"
          : "text-base md:text-lg";

  // data-text populado no server quando children e string; vazio caso
  // contrario (JSX/variavel). Mantem SSR === client para evitar mismatch.
  const initialDataText = typeof children === "string" ? children : "";

  return (
    <Comp
      data-text={initialDataText}
      className={cn(
        "scia-glitch font-display font-extrabold tracking-tight",
        sizeClass,
        className,
      )}
      {...props}
    >
      {children}
    </Comp>
  );
}
