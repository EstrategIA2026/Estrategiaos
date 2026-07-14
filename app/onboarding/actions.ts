"use server";

import { redirect } from "next/navigation";

import { config } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";

/**
 * Server Action do onboarding pos-signup. Grava no proprio `profiles` (via RLS,
 * "profiles_update_own") os dados coletados uma pergunta por vez e marca
 * `onboarded_at`, que sinaliza a conclusao do fluxo. Sucesso -> `/founder`.
 *
 * No modo `file` (dev/local, sem Supabase) nao ha profile para gravar: apenas
 * segue para a app, para o wizard poder ser visto localmente sem quebrar.
 */

/** Payload do onboarding (uma resposta por pergunta do wizard). */
export interface OnboardingData {
  fullName: string;
  email: string;
  whatsapp: string;
  companyName: string;
  employeeCount: string;
}

export async function completeOnboarding(
  data: OnboardingData,
): Promise<{ error?: string }> {
  // Modo `file`: sem persistencia de perfil — apenas entra na app.
  if (config.CONTENT_STORE !== "supabase") {
    redirect("/founder");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: data.fullName.trim() || null,
      email: data.email.trim() || user.email,
      whatsapp: data.whatsapp.trim() || null,
      company_name: data.companyName.trim() || null,
      employee_count: data.employeeCount.trim() || null,
      onboarded_at: now,
      updated_at: now,
    })
    .eq("id", user.id);

  if (error) {
    return { error: "Não foi possível salvar. Tente novamente." };
  }

  redirect("/founder");
}
