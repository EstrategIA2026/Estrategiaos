"use server";

/**
 * Action de leads via ANHP + Tavily + Hunter.io.
 *
 * Fluxo:
 *   1. ANHP lista hospitais REAIS (privados, 162+ no Brasil)
 *   2. Filtra por regiao do ICP (Nordeste/Ceara/etc)
 *   3. Tavily descobre o dominio institucional de cada hospital
 *   4. Hunter.io domain-search pega emails de decisores de saude
 *   5. Claude estrutura como enfermeiros/coordenadores (PF)
 *   6. Grava em validacao/leads como needs_review
 *
 * Por que ANHP e nao Tavily direto: Tavily retorna diretorios/LinkedIn, nao
 * nomes de hospitais oficiais. ANHP e a associacao que valida quais hospitais
 * privados sao associados — fonte autoritativa.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentProfile } from "@/lib/auth/profile";
import { AI_ENABLED, CHAT_ENABLED } from "@/lib/config";
import { filterByRegion, listAnahpHospitals } from "@/lib/leads/anahp";
import { hunterDomainSearch, type HunterPerson } from "@/lib/leads/hunter";
import { structureHunterLeads } from "@/lib/leads/structure-hunter";
import { tavily } from "@/lib/leads/tavily";
import { createClient } from "@/lib/supabase/server";

export type LeadsAnahpState = {
  error?: string;
  success?: string;
  count?: number;
  debug?: string;
} | undefined;

/** Padroes de dominio que NAO sao sites institucionais (midia, gov). */
const NON_INSTITUTIONAL_DOMAINS = [
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
  "g1.globo.com",
  "anahp.com.br",
  "conahp.org.br",
  "google.com",
  "google.com.br",
  "bing.com",
];

function isHospitalDomain(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase().replace(/^www\./, "");
    if (NON_INSTITUTIONAL_DOMAINS.some((bad) => host.endsWith(bad))) return null;
    // Apenas dominios .com.br / .com / .org validos.
    if (!/\.(com|org|net|io|me|app|dev|br)$/.test(host)) return null;
    return host;
  } catch {
    return null;
  }
}

/**
 * Para um hospital do ANHP, busca no Tavily o dominio institucional.
 * Devolve o dominio mais provavel (primeiro resultado valido).
 */
async function findHospitalDomain(
  hospitalName: string,
): Promise<{ domain: string | null; triedQuery: string }> {
  // Query focada: site oficial. Tavily ranqueia dominios institucionais
  // quando o termo do hospital e unico.
  const q = `"${hospitalName}" site oficial`;
  let results;
  try {
    results = await tavily(q, 6, { searchDepth: "basic" });
  } catch {
    return { domain: null, triedQuery: q };
  }
  for (const r of results) {
    const d = isHospitalDomain(r.url);
    if (d) return { domain: d, triedQuery: q };
  }
  return { domain: null, triedQuery: q };
}

export async function searchLeadsAnahp(
  _prev: LeadsAnahpState,
  formData: FormData,
): Promise<LeadsAnahpState> {
  if (!AI_ENABLED || !CHAT_ENABLED) {
    return { error: "IA nao configurada. Adicione ANTHROPIC_API_KEY e HUNTER_API_KEY." };
  }

  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const limitRaw = String(formData.get("limit") ?? "5");
  const limit = Math.max(1, Math.min(20, Number.parseInt(limitRaw, 10) || 5));

  const supabase = await createClient();

  // 1. Le o ICP (de onde extraimos a regiao).
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

  // 2. Lista hospitais reais via ANHP.
  const allHospitals = await listAnahpHospitals(200);
  debugLog.push(`ANHP: ${allHospitals.length} hospitais disponiveis`);

  // 3. Filtra por regiao (Nordeste para Estrateg[IA]).
  const filtered = filterByRegion(allHospitals, "Nordeste");
  debugLog.push(`ANHP filtrado (Nordeste): ${filtered.length} hospitais`);
  filtered.slice(0, 10).forEach((h) => debugLog.push(`  - ${h.name} (${h.slug})`));

  if (filtered.length === 0) {
    return {
      error: "ANHP nao retornou hospitais para a regiao do ICP.",
      debug: debugLog.join("\n"),
    };
  }

  // 4. Para cada hospital, tenta descobrir o dominio via Tavily.
  const hospitalsWithDomain: { hospitalName: string; domain: string }[] = [];
  const candidates = filtered.slice(0, 8); // testa ate 8 hospitais

  for (const h of candidates) {
    const { domain, triedQuery } = await findHospitalDomain(h.name);
    if (!domain) {
      debugLog.push(`Tavily: ${h.name} - dominio nao encontrado (query: ${triedQuery})`);
      continue;
    }
    hospitalsWithDomain.push({ hospitalName: h.name, domain });
    debugLog.push(`Tavily: ${h.name} -> ${domain}`);
  }

  if (hospitalsWithDomain.length === 0) {
    return {
      error:
        "Nao consegui descobrir o dominio de nenhum hospital via Tavily. Tente CNES direto ou alimente o ICP.",
      debug: debugLog.join("\n"),
    };
  }

  // 5. Hunter.io: para cada dominio, busca decisores de SAUDE.
  const NON_HEALTH_KEYWORDS = [
    "marketing", "sales", "vendas", "design", "engineering",
    "finance", "recruit", "rh", "people", "it", "tecnologia",
  ];
  const isHealthHint = (s: string | null | undefined) => {
    const lower = (s ?? "").toLowerCase();
    const healthHints = [
      "enferm", "nurse", "medic", "doutor", "dr.", "dra.",
      "coord", "gestor", "supervisor", "scih", "ccih",
      "qualidade", "epidemio", "fisioter", "psicolog",
      "atencao", "assisten", "clinica", "tecnico",
    ];
    return healthHints.some((h) => lower.includes(h));
  };

  const peopleByDomain: { domain: string; people: HunterPerson[] }[] = [];
  for (const { hospitalName, domain } of hospitalsWithDomain) {
    try {
      const result = await hunterDomainSearch(domain, {
        department: ["executive", "management", "operations", "medical"],
        seniority: ["executive", "senior"],
        limit: 10,
      });

      // Filtra por cargos de saude.
      const healthPeople = result.people.filter(
        (p) =>
          isHealthHint(p.fullName) ||
          isHealthHint(p.position) ||
          isHealthHint(p.department),
      );

      // Fallback: aceita cargos de gestao mesmo sem keyword de saude.
      const final =
        healthPeople.length > 0
          ? healthPeople
          : result.people.filter((p) => {
              const pos = (p.position ?? "").toLowerCase();
              if (NON_HEALTH_KEYWORDS.some((k) => pos.includes(k))) return false;
              return (
                pos.includes("coord") ||
                pos.includes("supervisor") ||
                pos.includes("diretor") ||
                pos.includes("gerente") ||
                pos.includes("chefe") ||
                pos.includes("head") ||
                pos.includes("gestor") ||
                pos.includes("manager")
              );
            });

      // Sobrescreve company com o nome do hospital do ANHP (autoritativo).
      const stamped = final.map((p) => ({ ...p, company: hospitalName }));

      peopleByDomain.push({ domain, people: stamped });
      debugLog.push(
        `Hunter ${domain}: ${result.people.length} -> ${stamped.length} (saude/coord)`,
      );
    } catch (e) {
      debugLog.push(
        `Hunter ${domain} falhou: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  const totalPeople = peopleByDomain.reduce((s, x) => s + x.people.length, 0);
  debugLog.push(`Total: ${totalPeople} pessoas coletadas`);

  if (totalPeople === 0) {
    return {
      error:
        "Hunter nao achou pessoas REAIS em nenhum dos dominios. Tente aumentar o limite ou revisar o ICP.",
      debug: debugLog.join("\n"),
    };
  }

  // 6. Claude estrutura (filtra por ICP).
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

  // 7. Grava no card validacao/leads.
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
        last_edited_by: "agent:leads-anahp",
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
    success: `${structured.length} leads REAIS encontrados (ANHP + Hunter). Revise na aba Leads.`,
    count: structured.length,
    debug: debugLog.join("\n"),
  };
}

interface AnahpLead {
  name: string;
  email: string;
  company: string;
  domain: string;
  position: string | null;
  linkedin: string | null;
  reason: string;
}

function renderHunterLeadsBlock(leads: AnahpLead[]): string {
  const now = new Date().toLocaleString("pt-BR");
  const blocks = leads.map((l) => {
    const head = `## ${l.name}`;
    const company = l.company ? ` — ${l.company}` : "";
    const position = l.position ? `\nCargo: ${l.position}` : "";
    const email = `\nEmail: ${l.email}`;
    const linkedin = l.linkedin ? `\nLinkedIn: ${l.linkedin}` : "";
    const reason = `\n\nPor que combina: ${l.reason}`;
    return `${head}${company}${position}${email}${linkedin}${reason}\n\n_(${l.domain} · ANHP + Hunter.io + Claude Sonnet 5 · ${now})_`;
  });
  return blocks.join("\n\n");
}
