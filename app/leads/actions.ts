"use server";

/**
 * Action de limpar todos os leads do card `validacao/leads`.
 *
 * Mantida aqui (separada do que era o fluxo de busca) apos a retirada
 * dos agentes Tavily/Hunter/ANHP. Continua util para resetar o CRM
 * depois de testes ou imports errados.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentProfile } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";

/** Limpa TODOS os leads do card `validacao/leads`. */
export async function clearLeads(): Promise<{ error?: string; success?: string }> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();
  const { data: leadsDoc } = await supabase
    .from("content_entities")
    .select("frontmatter")
    .eq("user_id", profile.id)
    .eq("entity_id", "validacao/leads")
    .maybeSingle();

  const prevFrontmatter =
    (leadsDoc?.frontmatter as Record<string, unknown> | null) ?? {};
  const prevRevision =
    typeof prevFrontmatter.revision === "number" ? prevFrontmatter.revision : 0;

  const { error: writeError } = await supabase.from("content_entities").upsert(
    {
      user_id: profile.id,
      entity_id: "validacao/leads",
      section: "validacao",
      frontmatter: {
        ...prevFrontmatter,
        revision: prevRevision + 1,
        status: "empty",
        last_edited_by: profile.email,
      },
      body: "",
      updated: new Date().toISOString(),
    },
    { onConflict: "user_id,entity_id" },
  );
  if (writeError) {
    return { error: `Erro ao limpar: ${writeError.message}` };
  }

  revalidatePath("/leads");
  revalidatePath("/", "layout");
  return { success: "Todos os leads foram removidos." };
}
