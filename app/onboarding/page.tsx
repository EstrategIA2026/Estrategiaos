import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { config } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";

import { OnboardingWizard } from "./wizard";

export const metadata: Metadata = { title: "Bem-vindo · BusinessOS" };

/**
 * Pagina de onboarding (server). Para onde o signup redireciona. Pre-preenche
 * nome/e-mail com o que ja conhecemos da conta e, se o onboarding ja foi
 * concluido (`onboarded_at`), pula direto para a app — nao repete o fluxo.
 *
 * No modo `file` (dev) roda sem sessao/perfil: mostra o wizard vazio para
 * inspecao local; o submit apenas segue para `/founder`.
 */
export default async function OnboardingPage() {
  let defaultName = "";
  let defaultEmail = "";

  if (config.CONTENT_STORE === "supabase") {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      redirect("/login");
    }

    defaultEmail = user.email ?? "";

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, onboarded_at")
      .eq("id", user.id)
      .single();

    if (profile?.onboarded_at) {
      redirect("/founder");
    }
    defaultName = profile?.full_name ?? "";
  }

  return (
    <OnboardingWizard defaultName={defaultName} defaultEmail={defaultEmail} />
  );
}
