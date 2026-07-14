"use server";

/**
 * Action de leads via Hunter.io — busca EMPRESAS REAIS com DECISORES.
 *
 * Fluxo:
 *   1. Tavily encontra dominios de hospitais (empresas reais)
 *   2. Hunter.io domain-search pega os emails dos decisores
 *   3. Claude resume e estrutura
 *   4. Grava em validacao/leads como needs_review
 *
 * Hunter.io NAO busca empresas a partir de cargo. A busca de empresa (com
 * dominio .com.br) e Tavily; Hunter complementa com pessoas REAIS via email.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentProfile } from "@/lib/auth/profile";
import { AI_ENABLED, CHAT_ENABLED } from "@/lib/config";
import { hunterDomainSearch, type HunterPerson } from "@/lib/leads/hunter";
import { structureHunterLeads } from "@/lib/leads/structure-hunter";
import { tavily } from "@/lib/leads/tavily";
import { createClient } from "@/lib/supabase/server";

export type LeadsHunterState = {
  error?: string;
  success?: string;
  count?: number;
  debug?: string;
} | undefined;

/** Padroes de dominio que NAO sao empresas (governo, academico, midia). */
const NON_COMPANY_DOMAINS = [
  ".gov.br",
  ".edu.br",
  ".org.br",
  "facebook.com",
  "instagram.com",
  "linkedin.com",
  "youtube.com",
  "twitter.com",
  "x.com",
  "wikipedia.org",
  "scielo.org",
  "scielo.br",
  "bvs.br",
  "fiocruz.br",
  "cnnbrasil.com.br",
  "globo.com",
  "uol.com.br",
  "folha.uol.com.br",
  "estadao.com.br",
  "camara.leg.br",
  "senado.leg.br",
  "planalto.gov.br",
];

function isCompanyDomain(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    if (NON_COMPANY_DOMAINS.some((bad) => host.endsWith(bad))) return null;
    // Apenas dominios .com.br / .com / .org validos.
    if (!/\.(com|org|net|io|me|app|dev|br)$/.test(host)) return null;
    return host.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export async function searchLeadsHunter(
  _prev: LeadsHunterState,
  formData: FormData,
): Promise<LeadsHunterState> {
  if (!AI_ENABLED || !CHAT_ENABLED) {
    return { error: "IA nao configurada. Adicione ANTHROPIC_API_KEY e HUNTER_API_KEY." };
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

  if (icpError || !icpDoc) {
    return {
      error: "ICP nao definido. Preencha o card 'direcao/perfil-ideal-de-cliente'.",
    };
  }
  const icpText = `${icpDoc.frontmatter?.title ?? ""}\n\n${icpDoc.body ?? ""}`.trim();
  if (!icpText) return { error: "ICP vazio." };

  // 2. Tavily: busca dominios de empresas.
  const baseQuery =
    "hospitais filantropicos Brasil 80 a 500 leitos coordenador Enfermagem NEP CCIH Qualidade";
  const query =
    icpText.length + baseQuery.length + 6 < 400
      ? `${icpText.slice(0, 380 - baseQuery.length - 6)} ${baseQuery}`
      : baseQuery;

  let tavilyResults;
  try {
    tavilyResults = await tavily(query, 10, { searchDepth: "advanced" });
  } catch (e) {
    return { error: `Tavily falhou: ${e instanceof Error ? e.message : String(e)}` };
  }
  if (tavilyResults.length === 0) {
    return { error: "Tavily nao retornou resultados." };
  }

  // 3. Extrai os dominios REAIS (exclui gov.br, linkedin, etc).
  const domains = Array.from(
    new Set(
      tavilyResults
        .map((r) => isCompanyDomain(r.url))
        .filter((d): d is string => d !== null)
        .filter((d) => d.length > 5)
        .slice(0, 6),
    ),
  );
  debugLog.push(`Tavily: ${tavilyResults.length} resultados, ${domains.length} dominios unicos`);
  domains.forEach((d) => debugLog.push(`  - ${d}`));

  if (domains.length === 0) {
    return {
      error: "Tavily nao trouxe dominios de empresa validos.",
      debug: debugLog.join("\n"),
    };
  }

  // 4. Hunter: para cada dominio, busca decisores.
  const peopleByDomain: { domain: string; people: HunterPerson[] }[] = [];
  for (const d of domains) {
    try {
      const result = await hunterDomainSearch(d, {
        department: ["executive", "management", "operations", "medical"],
        seniority: ["executive", "senior"],
        limit: 8,
      });
      peopleByDomain.push({ domain: d, people: result.people });
      debugLog.push(
        `Hunter ${d}: ${result.people.length} pessoas (${result.organization ?? "?"})`,
      );
    } catch (e) {
      debugLog.push(
        `Hunter ${d} falhou: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  const totalPeople = peopleByDomain.reduce((s, x) => s + x.people.length, 0);
  debugLog.push(`Total: ${totalPeople} pessoas coletadas`);

  if (totalPeople === 0) {
    return {
      error: "Hunter nao achou pessoas REAIS em nenhum dos dominios.",
      debug: debugLog.join("\n"),
    };
  }

  // 5. Claude estrutura (filtra por ICP).
  let structured;
  try {
    structured = await structureHunterLeads(icpText, peopleByDomain, limit);
  } catch (e) {
    return {
      error: `IA falhou: ${e instanceof Error ? e.message : String(e)}`,
      debug: debugLog.join("\n"),
    };
  }

  debugLog.push(`Claude estruturou ${structured.length} leads`);
  if (structured.length === 0) {
    return {
      error: "Claude nao retornou matches.",
      debug: debugLog.join("\n"),
    };
  }

  // 6. Grava no card validacao/leads.
  const { data: leadsDoc } = await supabase
    .from("content_entities")
    .select("body, frontmatter")
    .eq("user_id", profile.id)
    .eq("entity_id", "validacao/leads")
    .maybeSingle();

  const prevFrontmatter =
    (leadsDoc?.frontmatter as Record<string, unknown> | null) ?? {};
  const prevRevision =
    typeof prevFrontmatter.revision === "number" ? prevFrontmatter.revision : 1;
  const prevBody = String(leadsDoc?.body ?? "");
  const newBody =
    prevBody.trim().length > 0
      ? `${prevBody.trim()}\n\n---\n\n${renderHunterLeadsBlock(structured)}`
      : renderHunterLeadsBlock(structured);

  const { error: writeError } = await supabase.from("content_entities").upsert(
    {
      user_id: profile.id,
      entity_id: "validacao/leads",
      section: "validacao",
      frontmatter: {
        ...prevFrontmatter,
        revision: prevRevision + 1,
        status: "needs_review",
        last_edited_by: "agent:leads-hunter",
      },
      body: newBody,
      updated: new Date().toISOString(),
    },
    { onConflict: "user_id,entity_id" },
  );
  if (writeError) {
    return { error: `Erro ao gravar: ${writeError.message}`, debug: debugLog.join("\n") };
  }

  revalidatePath("/leads");
  revalidatePath("/", "layout");

  return {
    success: `${structured.length} leads REAIS encontrados (com email). Revise na aba Leads.`,
    count: structured.length,
    debug: debugLog.join("\n"),
  };
}

interface HunterLead {
  name: string;
  email: string;
  company: string;
  domain: string;
  position: string | null;
  linkedin: string | null;
  reason: string;
}

function renderHunterLeadsBlock(leads: HunterLead[]): string {
  const now = new Date().toLocaleString("pt-BR");
  const blocks = leads.map((l) => {
    const head = `## ${l.name}`;
    const company = l.company ? ` — ${l.company}` : "";
    const position = l.position ? `\nCargo: ${l.position}` : "";
    const email = `\nEmail: ${l.email}`;
    const linkedin = l.linkedin ? `\nLinkedIn: ${l.linkedin}` : "";
    const reason = `\n\nPor que combina: ${l.reason}`;
    return `${head}${company}${position}${email}${linkedin}${reason}\n\n_(${l.domain} · Hunter.io + Claude Sonnet 5 · ${now})_`;
  });
  return blocks.join("\n\n");
}
