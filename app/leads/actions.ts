"use server";

/**
 * Acoes de Leads — busca empresas via Tavily + Claude Fable 5 (kpalabz),
 * grava no card `validacao/leads` como `needs_review` para a founder revisar.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentProfile } from "@/lib/auth/profile";
import { AI_ENABLED, CHAT_ENABLED } from "@/lib/config";
import { structureLeads } from "@/lib/leads/structure";
import { tavily } from "@/lib/leads/tavily";
import { createClient } from "@/lib/supabase/server";

export type LeadsSearchState = {
  error?: string;
  success?: string;
  count?: number;
} | undefined;

interface ParsedLead {
  name: string;
  url?: string;
  kind?: "PJ" | "PF";
  summary: string;
  notes?: string;
  contacts?: Array<{ name: string; role?: string; contact?: string }>;
}

/**
 * Le o card `direcao/perfil-ideal-de-cliente`, usa Tavily para buscar
 * empresas na internet e Claude Fable 5 (kpalabz) para extrair leads
 * estruturados. Grava como `needs_review` no card `validacao/leads`.
 *
 * Quantidade padrao: 5 leads (controla custo e ruido).
 */
export async function searchLeads(
  _prev: LeadsSearchState,
  formData: FormData,
): Promise<LeadsSearchState> {
  if (!AI_ENABLED || !CHAT_ENABLED) {
    return {
      error:
        "IA nao configurada. Adicione ANTHROPIC_API_KEY e TAVILY_API_KEY no .env.local.",
    };
  }

  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const limitRaw = String(formData.get("limit") ?? "5");
  const limit = Math.max(1, Math.min(20, Number.parseInt(limitRaw, 10) || 5));

  const supabase = await createClient();

  // 1. Le o ICP.
  const { data: icpDoc, error: icpError } = await supabase
    .from("content_entities")
    .select("body, frontmatter")
    .eq("user_id", profile.id)
    .eq("entity_id", "direcao/perfil-ideal-de-cliente")
    .maybeSingle();
  if (icpError) {
    return { error: `Erro ao ler ICP: ${icpError.message}` };
  }
  if (!icpDoc?.body && !icpDoc?.frontmatter) {
    return {
      error:
        "ICP nao definido. Preencha o card 'direcao/perfil-ideal-de-cliente' antes de buscar leads.",
    };
  }

  const icpText = `${icpDoc.frontmatter?.title ?? ""}\n\n${icpDoc.body ?? ""}`.trim();
  if (!icpText) {
    return { error: "ICP vazio. Preencha o card antes de buscar." };
  }

  // 2. Tavily: busca empresas.
  let tavilyResults;
  try {
    tavilyResults = await tavily(icpText, Math.max(limit * 2, 6));
  } catch (e) {
    return {
      error: `Tavily falhou: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
  if (tavilyResults.length === 0) {
    return { error: "Tavily nao retornou resultados." };
  }

  // 3. Claude Fable 5 estrutura os leads.
  let structured: ParsedLead[];
  try {
    structured = await structureLeads(icpText, tavilyResults, limit);
  } catch (e) {
    return {
      error: `IA falhou: ${e instanceof Error ? e.message : String(e)}`,
    };
  }

  // 4. Le o card `validacao/leads` atual.
  const { data: leadsDoc } = await supabase
    .from("content_entities")
    .select("body, frontmatter")
    .eq("user_id", profile.id)
    .eq("entity_id", "validacao/leads")
    .maybeSingle();

  const prevFrontmatter =
    (leadsDoc?.frontmatter as Record<string, unknown> | null) ?? {};
  const prevRevision =
    typeof prevFrontmatter.revision === "number"
      ? prevFrontmatter.revision
      : 1;
  const prevBody = String(leadsDoc?.body ?? "");

  // 5. Append os leads novos no body do card.
  const newBody =
    prevBody.trim().length > 0
      ? `${prevBody.trim()}\n\n---\n\n${renderLeadsBlock(structured)}`
      : renderLeadsBlock(structured);

  // 6. Upsert no Supabase (frontend + status needs_review).
  const { error: writeError } = await supabase.from("content_entities").upsert(
    {
      user_id: profile.id,
      entity_id: "validacao/leads",
      section: "validacao",
      frontmatter: {
        ...prevFrontmatter,
        revision: prevRevision + 1,
        status: "needs_review",
        last_edited_by: "agent:leads",
      },
      body: newBody,
      updated: new Date().toISOString(),
    },
    { onConflict: "user_id,entity_id" },
  );
  if (writeError) {
    return { error: `Erro ao gravar: ${writeError.message}` };
  }

  revalidatePath("/leads");
  revalidatePath("/", "layout");

  return {
    success: `${structured.length} leads encontrados. Revise e aprove na aba Leads.`,
    count: structured.length,
  };
}

/** Renderiza a lista de leads no formato Markdown do card `validacao/leads`. */
function renderLeadsBlock(leads: ParsedLead[]): string {
  const now = new Date().toLocaleString("pt-BR");
  const blocks = leads.map((c) => {
    const head = `## ${c.name}`;
    const source = c.url ? `\nFonte: ${c.url}` : "";
    const contacts =
      c.contacts && c.contacts.length > 0
        ? `\nContatos: ${c.contacts
            .map(
              (p) =>
                `${p.name}${p.role ? ` (${p.role})` : ""}${p.contact ? ` <${p.contact}>` : ""}`,
            )
            .join("; ")}`
        : "";
    const notes = c.notes ? `\n\n${c.notes}` : "";
    return `${head}\n\n${c.summary}${source}${contacts}${notes}\n\n_(${c.kind ?? "PJ"} · Tavily + Claude Fable 5 · ${now})_`;
  });
  return blocks.join("\n\n");
}
