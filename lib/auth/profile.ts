import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

export interface CurrentProfile {
  id: string;
  email: string;
  /** Nome completo do profile (preenchido no onboarding) ou null. */
  fullName: string | null;
}

/**
 * Le o usuario logado e o `full_name` do profile em `public.profiles`.
 * Retorna `null` se nao houver sessao. Usa `cache()` (React) para deduplicar
 * durante o mesmo request — varios componentes na mesma pagina compartilham
 * a mesma chamada ao Supabase.
 *
 * Server-only (usa next/headers via createClient server).
 */
export const getCurrentProfile = cache(async (): Promise<CurrentProfile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();
  return {
    id: user.id,
    email: user.email ?? "",
    fullName: profile?.full_name ?? null,
  };
});

/** Resolve o nome de exibicao do usuario: `full_name` (primeiro nome) > email. */
export function displayName(p: CurrentProfile | null): string {
  if (!p) return "";
  if (p.fullName && p.fullName.trim()) {
    return p.fullName.trim().split(/\s+/)[0];
  }
  // fallback: parte local do email, capitalizada
  const local = p.email.split("@")[0];
  if (!local) return "";
  return local.charAt(0).toUpperCase() + local.slice(1);
}
