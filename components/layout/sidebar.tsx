import type { LucideIcon } from "lucide-react";
import { Bot, Compass, FlaskConical, Info, KanbanSquare, Sparkles, Target, User, Users, Wallet } from "lucide-react";

import { NavItem } from "@/components/layout/nav-item";
import { UserMenu } from "@/components/layout/user-menu";
import { SECTION_LABEL } from "@/lib/content/labels";
import type { Section } from "@/lib/content/schema";
import { sectionEnum } from "@/lib/content/schema";
import { cn } from "@/lib/utils";

/** Ícone por seção (camada de apresentação; rótulos vêm de labels/registry). */
const SECTION_ICON: Record<Section, LucideIcon> = {
  founder: User,
  direcao: Compass,
  validacao: FlaskConical,
  caixa: Wallet,
};

export interface SidebarProps {
  /** Seção atualmente ativa (destacada na nav). */
  activeSection?: Section;
  /** Segmento cru da rota (ex.: "agentes") — destaca itens fora do enum de seções. */
  activeSegment?: string;
  className?: string;
}

/**
 * Sidebar persistente (docs/03 §7.1) — visual "Flux".
 * Painel escuro flutuante: o `<aside>` reserva a largura e cola no topo (sticky),
 * e o `padding` cria a folga ao redor do painel `bg-sidebar rounded-md`. Funciona
 * tanto colada quanto flutuante porque o painel é autocontido.
 * Server component: marca com acento limão, navegação das 4 seções (na ordem
 * canônica do `sectionEnum`) e rodapé com meta. Recebe a seção ativa via prop.
 */
export function Sidebar({
  activeSection,
  activeSegment,
  className,
}: SidebarProps) {
  return (
    <aside
      className={cn(
        // z-20 mantém a sidebar por cima da "gaveta" de conversas (z-10),
        // que desliza por baixo dela na página Principal.
        "sticky top-0 z-20 h-dvh w-[--sidebar-width] shrink-0 p-3",
        className,
      )}
    >
      <div className="flex h-full flex-col rounded-md bg-sidebar px-4 py-5 text-sidebar-foreground">
        {/* Marca com quadradinho de acento laranja. */}
        <div className="flex shrink-0 items-center gap-2.5 px-2 pb-4">
          <span
            aria-hidden
            className="flex size-7 shrink-0 items-center justify-center rounded-md bg-brand text-sm font-extrabold text-brand-foreground scia-glow"
          >
            E
          </span>
          <span className="text-base font-extrabold tracking-tight">
            Estrateg<span className="text-brand">[IA]</span>
          </span>
        </div>

        <nav aria-label="Navegação" className="flex-1 space-y-1 font-mono">
          {/* Itens de destaque: Principal (chat) e Sobre (documento). */}
          <NavItem
            href="/principal"
            label="Principal"
            icon={Sparkles}
            active={activeSegment === "principal"}
          />
          <NavItem
            href="/sobre"
            label="Sobre"
            icon={Info}
            active={activeSegment === "sobre"}
          />

          <p className="scia-tag px-3 pb-2 pt-5">
            [ SECTIONS ]
          </p>
          {sectionEnum.options.map((section) => (
            <NavItem
              key={section}
              href={`/${section}`}
              label={SECTION_LABEL[section]}
              icon={SECTION_ICON[section]}
              active={section === activeSection}
            />
          ))}

          <p className="scia-tag px-3 pb-2 pt-5">
            [ SYSTEM ]
          </p>
          <NavItem
            href="/leads"
            label="Leads"
            icon={Users}
            active={activeSegment === "leads"}
          />
          <NavItem
            href="/oportunidades"
            label="Oportunidades"
            icon={Target}
            active={activeSegment === "oportunidades"}
          />
          <NavItem
            href="/workflow"
            label="Workflow"
            icon={KanbanSquare}
            active={activeSegment === "workflow"}
          />
          <NavItem
            href="/agentes"
            label="Agentes"
            icon={Bot}
            active={activeSegment === "agentes"}
          />
        </nav>

        <footer className="shrink-0 border-t border-sidebar-border pt-4 text-xs text-sidebar-muted">
          <UserMenu />
        </footer>
      </div>
    </aside>
  );
}
