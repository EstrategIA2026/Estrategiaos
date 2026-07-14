"use server";

/**
 * Acoes de Leads — busca empresas + pessoas via Tavily + Claude.
 * Grava no card `validacao/leads` como `needs_review` para a founder revisar.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentProfile } from "@/lib/auth/profile";
import { AI_ENABLED, CHAT_ENABLED } from "@/lib/config";
import { tavily } from "@/lib/leads/tavily";
import { structureLeads } from "@/lib/leads/structure";
import { createClient } from "@/lib/supabase/server";

export type LeadsSearchState = {
  error?: string;
  success?: string;
  count?: number;
  debug?: string;
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
 * EMPRESAS HOSPITALARES + PESSOAS, e Claude (Sonnet 5) para extrair
 * leads estruturados. Grava como `needs_review` em `validacao/leads`.
 *
 * Query focada em **encontrar hospitais reais brasileiros** com palavras
 * chave que funcionam em qualquer fonte.
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

  const debugLog: string[] = [];

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

  debugLog.push(`ICP length: ${icpText.length} chars`);

  // 2. Tavily: query simples e eficaz. Sem dominio restrito (Tavily ja
  // indexa bem a web aberta brasileira; incluir dominios especificos
  // as vezes reduz os resultados).
  // Query maxima: 400 chars. Tiramos o sufixo LEAD_QUERY_SUFFIX quando o ICP
  // sozinho ja alcancar 400; caso contrario, encurtamos o ICP.
  const baseQuery =
    "hospitais filantropicos Brasil 80 a 500 leitos coordenadores Enfermagem NEP CCIH Qualidade";
  const query =
    icpText.length + baseQuery.length + 6 < 400
      ? `${icpText.slice(0, 380 - baseQuery.length - 6)} ${baseQuery}`
      : baseQuery;

  debugLog.push(`Tavily query (${query.length} chars): ${query.slice(0, 100)}...`);

  let tavilyResults;
  try {
    tavilyResults = await tavily(query, 10, {
      searchDepth: "advanced",
      includeAnswer: false,
    });
  } catch (e) {
    return {
      error: `Tavily falhou: ${e instanceof Error ? e.message : String(e)}`,
    };
  }

  debugLog.push(`Tavily returned ${tavilyResults.length} results`);
  tavilyResults.slice(0, 5).forEach((r, i) => {
    debugLog.push(`  [${i + 1}] ${r.title.slice(0, 60)} -> ${r.url.slice(0, 50)}`);
  });

  if (tavilyResults.length === 0) {
    return {
      error:
        "Tavily nao retornou resultados para a busca. Tente reformular o ICP.",
      debug: debugLog.join("\n"),
    };
  }

  // 3. Claude Sonnet 5 estrutura os leads.
  let structured: ParsedLead[];
  try {
    structured = await structureLeads(icpText, tavilyResults, limit);
  } catch (e) {
    return {
      error: `IA falhou: ${e instanceof Error ? e.message : String(e)}`,
      debug: debugLog.join("\n"),
    };
  }

  debugLog.push(`Claude returned ${structured.length} structured leads`);

  if (structured.length === 0) {
    return {
      error:
        "Claude nao extraiu nenhum lead dos resultados do Tavily. O ICP pode estar muito especifico ou o Tavily trouxe resultados pouco alinhados.",
      debug: debugLog.join("\n"),
    };
  }

  // 4. Grava no card `validacao/leads` como needs_review.
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

  const newBody =
    prevBody.trim().length > 0
      ? `${prevBody.trim()}\n\n---\n\n${renderLeadsBlock(structured)}`
      : renderLeadsBlock(structured);

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
    return {
      error: `Erro ao gravar: ${writeError.message}`,
      debug: debugLog.join("\n"),
    };
  }

  revalidatePath("/leads");
  revalidatePath("/", "layout");

  return {
    success: `${structured.length} leads encontrados. Revise e aprove na aba Leads.`,
    count: structured.length,
    debug: debugLog.join("\n"),
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
    return `${head}\n\n${c.summary}${source}${contacts}${notes}\n\n_(${c.kind ?? "PJ"} · Tavily + Claude Sonnet 5 · ${now})_`;
  });
  return blocks.join("\n\n");
}
