import "server-only";

/**
 * Carrega o estado completo do BusinessOS do tenant logado.
 *
 * Retorna o `full_name` + e-mail do founder + um resumo estruturado de
 * cada uma das 11 entidades (frontmatter.title + summary + secao). Utilizado
 * pelo chat para ter memoria completa do BusinessOS alem do RAG fragmentado.
 *
 * Limitado a ~3000 chars por entidade para nao estourar o system prompt.
 * Cache leve por request via `cache()` do React.
 */
import { cache } from "react";

import { getCurrentProfile } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";

const MAX_ENTITY_CHARS = 3000;

export const loadTenantContext = cache(async (): Promise<string> => {
  const profile = await getCurrentProfile();
  if (!profile) return "";

  const supabase = await createClient();

  const { data: rows, error } = await supabase
    .from("content_entities")
    .select("entity_id, section, frontmatter, body")
    .eq("user_id", profile.id)
    .order("entity_id");

  if (error || !rows || rows.length === 0) return "";

  const sections: Record<string, string[]> = {
    founder: [],
    direcao: [],
    validacao: [],
    caixa: [],
  };

  for (const row of rows) {
    const fm = (row.frontmatter ?? {}) as Record<string, unknown>;
    const title = String(fm.title ?? row.entity_id);
    const summary = String(fm.summary ?? "").slice(0, 600);
    const body = String(row.body ?? "").slice(0, MAX_ENTITY_CHARS);

    const block = [
      `### ${row.entity_id} [${row.section}]`,
      summary ? `Summary: ${summary}` : "",
      body ? `Body (truncated):\n${body}` : "(vazio)",
    ]
      .filter(Boolean)
      .join("\n");

    if (sections[row.section]) {
      sections[row.section].push(block);
    }
  }

  const blocks: string[] = [];
  blocks.push(`# BUSINESSOS CONTEXT`);
  blocks.push(
    `Founder: ${profile.fullName?.trim() || "(sem nome)"} <${profile.email}>`,
  );

  for (const section of ["founder", "direcao", "validacao", "caixa"] as const) {
    if (sections[section].length === 0) continue;
    blocks.push("");
    blocks.push(`## ${section.toUpperCase()}`);
    blocks.push(sections[section].join("\n\n"));
  }

  return blocks.join("\n");
});

/** System prompt do chat com o BusinessOS inteiro embutido. */
export function buildTenantSystemPrompt(context: string): string {
  if (!context) {
    return "Voce e o assistente do BusinessOS. Sem dados do tenant carregados.";
  }
  return [
    "Voce e o assistente do BusinessOS, o OS de decisao do founder.",
    "",
    "Abaixo esta o estado COMPLETO do BusinessOS do tenant (todas as 11",
    "entidades, frontmatter + body). Use isso como fonte primaria de verdade.",
    "Sempre que o fundador perguntar algo sobre o negocio dele, consulte este",
    "contexto primeiro. Se voce nao achar aqui, sinalize e sugira atualizar a",
    "entidade correspondente.",
    "",
    "Responda sempre em portugues do Brasil, de forma direta e executiva.",
    "Cite a entidade exata (ex.: `direcao/perfil-ideal-de-cliente`) quando",
    "referenciar conteudo.",
    "",
    "=====================",
    context,
    "=====================",
  ].join("\n");
}
