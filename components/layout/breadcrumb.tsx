import { Fragment } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";

export interface Crumb {
  label: string;
  /** Destino do link; ausente => item atual (não navegável). */
  href?: string;
}

export interface BreadcrumbProps {
  items: Crumb[];
  className?: string;
}

/**
 * Trilha de navegação do topbar (docs/03 §7.1): raiz da seção -> entidade atual.
 * O último item é sempre a página atual (`aria-current="page"`, sem link),
 * mesmo que traga `href`. Server component: só links e texto.
 */
export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Trilha de navegação" className={cn("min-w-0", className)}>
      <ol className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em]">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <Fragment key={`${item.label}-${index}`}>
              <li className="flex min-w-0 items-center">
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    className="scia-link truncate text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    aria-current={isLast ? "page" : undefined}
                    className={cn(
                      "truncate",
                      isLast
                        ? "text-brand"
                        : "text-muted-foreground",
                    )}
                  >
                    {item.label}
                  </span>
                )}
              </li>
              {!isLast && (
                <span
                  className="shrink-0 text-muted-foreground/40"
                  aria-hidden
                >
                  /
                </span>
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
