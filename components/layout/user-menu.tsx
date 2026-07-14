"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogOut, Settings } from "lucide-react";

import { CodeMatrix } from "@/components/effects/code-matrix";
import { createClient } from "@/lib/supabase/client";

/**
 * Menu de usuario no rodape da sidebar (ADR 0001 §4). Client component:
 * resolve o e-mail da sessao e o avatar_url (signed URL do bucket
 * `attachments`) via Supabase client, e oferece o link para `/conta` e o
 * botao "Sair".
 *
 * No hover da area, um efeito code-matrix Estrateg[IA] rola no fundo.
 *
 * No modo `file` (dev/local, sem sessao) nao ha usuario logado — degrada
 * para um rotulo discreto "Sessao local" sem botao de sair.
 */
export function UserMenu() {
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let active = true;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!active) return;
      if (!user) {
        setResolved(true);
        return;
      }
      setEmail(user.email ?? null);

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_path")
        .eq("id", user.id)
        .maybeSingle();

      if (!active) return;
      if (profile?.full_name) setName(profile.full_name);
      if (profile?.avatar_path) {
        const { data: signed } = await supabase.storage
          .from("attachments")
          .createSignedUrl(profile.avatar_path, 60 * 60);
        if (signed?.signedUrl) setAvatarUrl(signed.signedUrl);
      }
      setResolved(true);
    })();
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

  const iniciais = (
    name?.[0] ||
    email?.[0] ||
    "?"
  ).toUpperCase();

  return (
    <div className="group relative overflow-hidden rounded-md">
      <CodeMatrix className="text-brand/30" />
      <div className="relative flex items-center justify-between gap-2 px-2 py-1.5">
        <Link
          href="/conta"
          className="flex min-w-0 flex-1 items-center gap-2.5 transition-colors hover:text-sidebar-foreground"
          aria-label="Abrir configuracoes da conta"
        >
          <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted font-display text-sm font-extrabold text-brand">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={name ?? email ?? "Avatar"}
                className="size-full object-cover"
              />
            ) : (
              <span>{iniciais}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 truncate text-xs font-medium text-sidebar-foreground">
              {name || "Conta"}
              <Settings
                className="size-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                aria-hidden
              />
            </p>
            <p className="truncate text-[11px] text-sidebar-muted" title={email ?? undefined}>
              {email ?? "…"}
            </p>
          </div>
        </Link>
        <form action="/auth/signout" method="post" className="shrink-0">
          <button
            type="submit"
            aria-label="Sair"
            title="Sair"
            className="flex size-8 items-center justify-center rounded-md text-sidebar-muted transition-colors hover:bg-white/5 hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
          >
            <LogOut className="size-4" aria-hidden />
          </button>
        </form>
      </div>
    </div>
  );
}
