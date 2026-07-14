import "server-only";

/**
 * Estruturacao de leads com Claude Fable 5 (via gateway kpalabz).
 *
 * Recebe o ICP (texto livre) + resultados Tavily e devolve um array
 * estruturado de empresas (PJ) com nome, URL, summary e contatos opcionais.
 */
import { createAnthropic } from "@ai-sdk/anthropic";
import { generateText, type LanguageModel } from "ai";

import type { TavilyResult } from "@/lib/leads/tavily";

export interface StructuredLead {
  name: string;
  url?: string;
  kind?: "PJ" | "PF";
  summary: string;
  notes?: string;
  contacts?: Array<{ name: string; role?: string; contact?: string }>;
}

interface StructureResponse {
  leads: StructuredLead[];
}

const STRUCTURE_SYSTEM = [
  "Voce e um agente de prospeccao do Estrateg[IA] (BusinessOS).",
  "Recebe um ICP (texto livre com o perfil de coordenador de nucleo hospitalar) ",
  "e uma lista de resultados de busca na web (Tavily). Sua tarefa: extrair ",
  "EMPRESAS HOSPITALARES + PESSOAS (coordenadores) que batam com o ICP,",
  "e devolver cada um num objeto estruturado.",
  "",
  "Regras:",
  "- Responda SOMENTE com JSON valido no formato { \"leads\": [...] }.",
  "- NAO escreva prosa, NAO use cercas ```, NAO use outros idiomas.",
  "- Feche TODAS as chaves e colchetes.",
  "- Cada lead deve ter `name` (nome da empresa OU da pessoa) e `kind`:",
  "  * `kind: \"PJ\"` para hospitais, redes, laboratórios, associações de saúde",
  "  * `kind: \"PF\"` para coordenadores, enfermeiros, médicos identificáveis",
  "- Para PJ: `name` e o nome do hospital ou instituicao.",
  "- Para PF: `name` e o nome completo da pessoa, e tente incluir o cargo.",
  "- Priorize qualidade: 1 match relevante vale mais que 5 fracos.",
  "- NUNCA devolva `leads: []` se houver QUALQUER relacao com saude/hospital/coordenacao.",
  "  E melhor incluir candidato fraco do que nada. A founder filtra depois.",
  "- O `summary` (1-2 frases) deve dizer POR QUE o match tem relacao com o ICP.",
  "- Quando o ICP tiver criterios explicitos (regiao, porte, acreditacao),",
  "  priorize matches que atendam a TODOS os criterios, mas inclua tambem",
  "  matches parciais se a regiao ou porte for generica o suficiente.",
].join(" ");

const STRUCTURE_SHAPE = `{
  "leads": [
    {
      "name": "Nome da Empresa",
      "url": "https://...",
      "kind": "PJ",
      "summary": "1-2 frases em pt-BR dizendo o por que combina com o ICP.",
      "notes": "Observacoes extras opcionais.",
      "contacts": [
        { "name": "Nome da pessoa", "role": "Cargo", "contact": "email@dominio" }
      ]
    }
  ]
}`;

/** Cache lazy do provider (igual ao chat-provider). */
let cachedModel: LanguageModel | null = null;
function model(): LanguageModel {
  if (cachedModel) return cachedModel;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY nao configurada.");
  }
  const anthropic = createAnthropic({
    apiKey,
    baseURL: "https://api.kpalabz.com/v1",
  });
  // Sonnet 5: melhor custo/beneficio pra extracao estruturada. Fable 5 e mais
  // "criativo" e tende a devolver arrays vazios quando nao ha match perfeito.
  cachedModel = anthropic("claude-sonnet-5");
  return cachedModel;
}

/**
 * Estrutura os resultados Tavily em leads alinhados com o ICP, usando
 * Claude Fable 5. Devolve ate `limit` leads.
 */
export async function structureLeads(
  icpText: string,
  tavilyResults: TavilyResult[],
  limit: number,
): Promise<StructuredLead[]> {
  // Compacta os resultados Tavily para o prompt nao ficar gigante.
  const compact = tavilyResults
    .map(
      (r, i) =>
        `${i + 1}. [${r.title}](${r.url})\n   ${r.content.slice(0, 400).replace(/\s+/g, " ")}`,
    )
    .join("\n\n");

  const prompt =
    `ICP (perfil ideal de cliente):\n${icpText.slice(0, 1500)}\n\n` +
    `Resultados Tavily (${tavilyResults.length}):\n${compact}\n\n` +
    `Extraia ate ${limit} leads no formato:\n${STRUCTURE_SHAPE}`;

  const { text } = await generateText({
    model: model(),
    maxOutputTokens: 8192,
    providerOptions: {
      anthropic: { thinking: { type: "disabled" } },
    },
    system: STRUCTURE_SYSTEM,
    prompt,
  });

  return extractJson(text, limit);
}

/** Extrai `{ leads: [...] }` do text, tolerante a fence ```json. */
function extractJson(raw: string, limit: number): StructuredLead[] {
  let s = raw.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence?.[1]) s = fence[1].trim();
  const start = s.indexOf("{");
  if (start < 0) {
    throw new Error("IA nao retornou JSON reconhecivel.");
  }
  const candidate = s.slice(start);
  const lastClose = candidate.lastIndexOf("}");
  for (let end = lastClose; end > start; end = candidate.lastIndexOf("}", end - 1)) {
    try {
      const obj = JSON.parse(candidate.slice(0, end - start + 1)) as StructureResponse;
      const leads = Array.isArray(obj?.leads) ? obj.leads : [];
      return leads.slice(0, limit).map(normalize);
    } catch {
      // tenta o `}` anterior
    }
  }
  throw new Error("IA retornou JSON malformado.");
}

function normalize(lead: Partial<StructuredLead>): StructuredLead {
  return {
    name: String(lead.name ?? "(sem nome)").slice(0, 120),
    url: typeof lead.url === "string" ? lead.url.slice(0, 300) : undefined,
    kind: lead.kind === "PF" ? "PF" : "PJ",
    summary: String(lead.summary ?? "").slice(0, 280),
    notes: typeof lead.notes === "string" ? lead.notes.slice(0, 400) : undefined,
    contacts: Array.isArray(lead.contacts)
      ? lead.contacts.slice(0, 5).map((c) => ({
          name: String(c?.name ?? "").slice(0, 80),
          role: typeof c?.role === "string" ? c.role.slice(0, 80) : undefined,
          contact: typeof c?.contact === "string" ? c.contact.slice(0, 120) : undefined,
        }))
      : undefined,
  };
}
