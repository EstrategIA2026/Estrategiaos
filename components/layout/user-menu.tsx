"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogOut, Settings } from "lucide-react";

import { createClient } from "@/lib/supabase/client";

/**
 * Menu de usuario no rodape da sidebar (ADR 0001 §4). Client component:
 * resolve o e-mail da sessao via cliente browser do Supabase e oferece o botao
 * "Sair" (POST para `/auth/signout`) e o link para `/conta`.
 *
 * No modo `file` (dev/local, sem sessao) nao ha usuario logado — degrada para
 * um rotulo discreto "Sessão local" sem botao de sair, mantendo o dev intacto.
 */
export function UserMenu() {
  const [email, setEmail] = useState<string | null>(null);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setEmail(data.user?.email ?? null);
      setResolved(true);
    });
    return () => {
      active = false;
    };
  }, []);

  if (resolved && !email) {
    // Modo local (sem auth): sem sessao para encerrar.
    return (
      <div className="px-2">
        <p className="font-medium text-sidebar-foreground">BusinessOS</p>
        <p>Sessão local · dev</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 px-2">
      <Link
        href="/conta"
        className="group min-w-0 flex-1 transition-colors hover:text-sidebar-foreground"
        aria-label="Abrir configuracoes da conta"
      >
        <p className="flex items-center gap-1.5 font-medium text-sidebar-foreground">
          Conta
          <Settings
            className="size-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
            aria-hidden
          />
        </p>
        <p className="truncate" title={email ?? undefined}>
          {email ?? "…"}
        </p>
      </Link>
      <form action="/auth/signout" method="post" className="shrink-0">
        <button
          type="submit"
          aria-label="Sair"
          title="Sair"
          className="flex size-8 items-center justify-center rounded-full text-sidebar-muted transition-colors hover:bg-white/5 hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
        >
          <LogOut className="size-4" aria-hidden />
        </button>
      </form>
    </div>
  );
}
