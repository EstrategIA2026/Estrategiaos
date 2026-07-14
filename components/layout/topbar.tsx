import type { ReactNode } from "react";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { cn } from "@/lib/utils";

export interface TopbarProps {
  /** Conteudo da faixa fixa (ex.: `Breadcrumb`), alinhado a esquerda. */
  breadcrumb?: ReactNode;
  /** Bloco de titulo/meta abaixo da faixa; rola com a pagina. */
  children?: ReactNode;
  className?: string;
}

/**
 * Topbar full-width do app (docs/03 §7.1) — Estrateg[IA] visual.
 * Faixa superior com a trilha de navegacao a esquerda e o alternador de tema
 * a direita, mais um bloco de titulo/meta logo abaixo. A faixa e separada
 * do conteudo por uma linha gradiente laranja (efeito .scia-rule).
 */
export function Topbar({ breadcrumb, children, className }: TopbarProps) {
  return (
    <>
      <div
        className={cn(
          "sticky top-0 z-20 bg-background/85 backdrop-blur",
          className,
        )}
      >
        <div className="flex h-14 items-center justify-between gap-3 px-6 md:px-8">
          <div className="min-w-0">{breadcrumb}</div>
          <ThemeToggle />
        </div>
        <hr className="scia-rule m-0" />
      </div>

      {children && (
        <div className="px-6 pb-2 pt-6 md:px-8">{children}</div>
      )}
    </>
  );
}
