import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export interface NavItemProps {
  /** Destino do link (ex.: "/direcao"). */
  href: string;
  /** Rotulo visivel em pt-BR. */
  label: string;
  /** Icone lucide (componente). */
  icon: LucideIcon;
  /** Marca o item como a secao ativa (aria-current + barra laranja). */
  active?: boolean;
  /** Desabilita a navegacao (sem foco, sem ponteiro). */
  disabled?: boolean;
}

/**
 * Item de navegacao da sidebar (docs/03 §7.1) — visual Estrateg[IA].
 *
 * Ativo = barra vertical laranja de 3px a esquerda (estilo "ticked") + texto
 * branco + icone laranja. Inativo = texto esmaecido que clareia no hover, e
 * icone com bracket reveal sutil via classes auxiliares.
 */
export function NavItem({
  href,
  label,
  icon: Icon,
  active = false,
  disabled = false,
}: NavItemProps) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : undefined}
      className={cn(
        "group relative flex h-9 items-center gap-3 rounded-md px-3 text-[12px] uppercase tracking-[0.06em] transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
        active
          ? "bg-white/5 font-semibold text-sidebar-foreground"
          : "text-sidebar-muted hover:bg-white/5 hover:text-sidebar-foreground",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      {active && (
        <span
          aria-hidden
          className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-brand scia-glow"
        />
      )}
      <Icon
        className={cn(
          "size-4 shrink-0 transition-colors",
          active ? "text-brand" : "group-hover:text-brand",
        )}
        aria-hidden
      />
      <span className="flex-1 truncate">{label}</span>
    </Link>
  );
}
