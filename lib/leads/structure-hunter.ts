import "server-only";

/**
 * Estrutura leads Hunter.io + Tavily em matches com o ICP, via Claude.
 *
 * Recebe:
 *   - ICP (perfil ideal de cliente)
 *   - Lista de dominios com pessoas REAIS (Hunter.io)
 *   - Limite de leads a devolver
 *
 * Devolve um array de leads ordenados por fit com o ICP.
 */
import { createAnthropic } from "@ai-sdk/anthropic";
import { generateText, type LanguageModel } from "ai";

import type { HunterPerson } from "@/lib/leads/hunter";

export interface HunterLead {
  name: string;
  email: string;
  company: string;
  domain: string;
  position: string | null;
  linkedin: string | null;
  reason: string;
}

const STRUCTURE_SYSTEM = [
  "Voce e um agente de prospeccao do Estrateg[IA] (BusinessOS).",
  "Recebe um ICP (perfil ideal de cliente) e uma lista de PESSOAS REAIS (Hunter.io)",
  "com nome, email, cargo, empresa e dominio. Sua tarefa: filtrar e devolver",
  "APENAS as pessoas com maior fit com o ICP, ordenadas por relevancia.",
  "",
  "PREFERENCIAS DO ICP (ordem de prioridade):",
  "1. ENFERMEIROS ou coordenadores de nucleo hospitalar (Enfermagem, NEP, CCIH, Qualidade, SCIH).",
  "2. Cargos de gestao/decisao: coordenador(a), supervisor(a), chefe, diretor(a), gerente.",
  "3. Setor hospitalar ou de saude.",
  "4. Cargos de TI ou administrativo em saude (ex: TI hospitalar, gestor de qualidade).",
  "",
  "Regras:",
  "- Responda SOMENTE com JSON valido no formato { \"leads\": [...] }.",
  "- NAO escreva prosa, NAO use cercas ```, NAO use outros idiomas.",
  "- Feche TODAS as chaves.",
  "- Cada lead: { name, email, company, domain, position, linkedin, reason }.",
  "- `reason` (1 frase) explica por que a pessoa tem fit com o ICP.",
  "- Se nao houver match obvio, devolva o array vazio.",
].join(" ");

const STRUCTURE_SHAPE = `{
  "leads": [
    {
      "name": "Nome completo",
      "email": "email@empresa.com",
      "company": "Nome da empresa",
      "domain": "empresa.com",
      "position": "Cargo da pessoa",
      "linkedin": "https://linkedin.com/in/...",
      "reason": "Por que tem fit com o ICP."
    }
  ]
}`;

let cachedModel: LanguageModel | null = null;
function model(): LanguageModel {
  if (cachedModel) return cachedModel;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY nao configurada.");
  const anthropic = createAnthropic({
    apiKey,
    baseURL: "https://api.kpalabz.com/v1",
  });
  cachedModel = anthropic("claude-sonnet-5");
  return cachedModel;
}

export async function structureHunterLeads(
  icpText: string,
  peopleByDomain: { domain: string; people: HunterPerson[] }[],
  limit: number,
): Promise<HunterLead[]> {
  // Compacta a entrada para o prompt nao ficar enorme.
  const compact = peopleByDomain
    .map(
      (g) =>
        `## Dominio: ${g.domain}\n` +
        g.people
          .map(
            (p) =>
              `  - ${p.fullName} (${p.position ?? "?"}) — ${p.email} [${p.department ?? "?"}/${p.seniority ?? "?"}] @ ${p.company}`,
          )
          .join("\n"),
    )
    .join("\n");

  const prompt =
    `ICP (perfil ideal de cliente):\n${icpText.slice(0, 1500)}\n\n` +
    `Pessoas REAIS (Hunter.io, ate ${peopleByDomain.reduce((s, g) => s + g.people.length, 0)}):\n${compact}\n\n` +
    `Filtre e devolva ate ${limit} pessoas com maior fit no formato:\n${STRUCTURE_SHAPE}`;

  const { text } = await generateText({
    model: model(),
    maxOutputTokens: 8192,
    providerOptions: { anthropic: { thinking: { type: "disabled" } } },
    system: STRUCTURE_SYSTEM,
    prompt,
  });

  return extractHunterJson(text, limit);
}

function extractHunterJson(raw: string, limit: number): HunterLead[] {
  let s = raw.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence?.[1]) s = fence[1].trim();
  const start = s.indexOf("{");
  if (start < 0) throw new Error("IA nao retornou JSON.");
  const candidate = s.slice(start);
  const lastClose = candidate.lastIndexOf("}");
  for (let end = lastClose; end > start; end = candidate.lastIndexOf("}", end - 1)) {
    try {
      const obj = JSON.parse(candidate.slice(0, end - start + 1)) as { leads: HunterLead[] };
      return (obj.leads ?? []).slice(0, limit);
    } catch {
      // tenta o } anterior
    }
  }
  return [];
}
