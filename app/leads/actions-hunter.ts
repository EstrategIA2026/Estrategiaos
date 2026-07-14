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

  // 4. Hunter: para cada dominio, busca decisores de SAUDE.
  // Filtro focado: management + medical (exclui marketing, vendas, etc).
  // Filtra nomes que claramente NAO sao da saude (heuristica simples).
  const NON_HEALTH_KEYWORDS = [
    "marketing", "sales", "vendas", "design", "engineering",
    "finance", "recruit", "rh", "people", "it", "tecnologia",
  ];
  const isHealthName = (n: string) => {
    const lower = n.toLowerCase();
    // Palavras-chave que indicam saude/enfermagem.
    const healthHints = [
      "enferm", "nurse", "medic", "doutor", "dr.", "dra.",
      "coord", "gestor", "supervisor", "scih", "ccih",
      "qualidade", "epidemio", "fisioter", "psicolog",
    ];
    return healthHints.some((h) => lower.includes(h));
  };

  const peopleByDomain: { domain: string; people: HunterPerson[] }[] = [];
  for (const d of domains) {
    try {
      const result = await hunterDomainSearch(d, {
        department: ["executive", "management", "operations", "medical"],
        seniority: ["executive", "senior"],
        limit: 12,
      });
      // Filtra por nome que pareca de saude.
      const healthPeople = result.people.filter(
        (p) =>
          (isHealthName(p.fullName) ||
            isHealthName(p.position ?? "") ||
            isHealthName(p.department ?? "") ||
            // Se nao tem keyword explicita, aceita se cargo eh management
            (p.position ?? "").toLowerCase().includes("coord") ||
            (p.position ?? "").toLowerCase().includes("chefia") ||
            (p.position ?? "").toLowerCase().includes("diretor")),
      );
      // Se filtro de saude nao pegou nada, ainda tenta pegar os management
      const final = healthPeople.length > 0
        ? healthPeople
        : result.people.filter(
            (p) => !NON_HEALTH_KEYWORDS.some((k) =>
              (p.position ?? "").toLowerCase().includes(k),
            ),
          );
      peopleByDomain.push({ domain: d, people: final });
      debugLog.push(
        `Hunter ${d}: ${result.people.length} -> ${final.length} (saude/coord)`,
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

/** Parse leads de Hunter no formato `{ leads: [...] }` para o card. */
export function parseHunterLeadsMarkdown(
  body: string,
): { companies: { id: string; name: string; source: string; stage: "new"; addedAt: string; note?: string }[]; people: { id: string; name: string; role?: string; email?: string; linkedin?: string; companyId?: string; source: string; addedAt: string }[] } {
  const companies: { id: string; name: string; source: string; stage: "new"; addedAt: string; note?: string }[] = [];
  const people: { id: string; name: string; role?: string; email?: string; linkedin?: string; companyId?: string; source: string; addedAt: string }[] = [];

  const sections = body.split(/\n##\s+/).filter(Boolean);
  for (const section of sections) {
    const lines = section.split("\n");
    const title = (lines[0]?.trim() ?? "").replace(/^#+\s*/, "");
    if (!title) continue;
    const companyLine = lines.find((l) => l.startsWith("— "));
    const companyName = companyLine?.replace(/^—\s*/, "").trim() ?? title;
    const positionLine = lines.find((l) => l.startsWith("Cargo:"));
    const position = positionLine?.replace(/^Cargo:\s*/, "").trim() ?? undefined;
    const emailLine = lines.find((l) => l.startsWith("Email:"));
    const email = emailLine?.replace(/^Email:\s*/, "").trim() ?? undefined;
    const linkedinLine = lines.find((l) => l.startsWith("LinkedIn:"));
    const linkedin = linkedinLine?.replace(/^LinkedIn:\s*/, "").trim() ?? undefined;
    const sourceLine = lines.find((l) => l.startsWith("_("));
    const source =
      sourceLine?.match(/\(([^·]+)·/)?.[1]?.trim() ?? "Hunter.io";
    const domain = sourceLine?.match(/\(([^)]+)\s*·/)?.[1]?.trim() ?? "—";

    const slug = (s: string) =>
      s
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60);

    const personId = slug(title);
    const companyId = slug(companyName);
    const now = new Date().toISOString();

    people.push({
      id: personId,
      name: title,
      role: position,
      email,
      linkedin,
      companyId,
      source: "Hunter.io + Claude Sonnet 5",
      addedAt: now,
    });
    if (!companies.find((c) => c.id === companyId)) {
      companies.push({
        id: companyId,
        name: companyName,
        source: `Hunter.io · ${domain}`,
        stage: "new",
        addedAt: now,
      });
    }
  }

  return { companies, people };
}
