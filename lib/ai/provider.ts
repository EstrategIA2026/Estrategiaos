import "server-only";

import { createAnthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { z } from "zod";

import { config } from "@/lib/config";
import { reportSchema, type Report } from "@/lib/content/schema";

/**
 * Integracao de IA no runtime (ADR 0001 §6) via Vercel AI SDK + `@ai-sdk/anthropic`.
 * Server-only: le a `ANTHROPIC_API_KEY` de `config`. Enquanto a chave nao existir,
 * este modulo nem e chamado (as rotas checam `AI_ENABLED` antes) — "cabo solto".
 *
 * A IA PROPOE; grava-se pela MESMA porta que os humanos (`writeEntity` com
 * `editor: 'agent:ai'` -> `status: needs_review`). Aqui ficam apenas os helpers
 * de geracao (texto/estrutura); a escrita mora na rota `app/api/ai/fill`.
 */

/**
 * Modelo Claude padrao. Trocavel por esta constante — aponte para outro id valido
 * (ex.: "claude-opus-4-8") sem mais mudancas de codigo, so reiniciando.
 */
export const AI_MODEL_ID = "claude-sonnet-4-5";

/** Contexto de uma entidade relacionada (profundidade 1) para ancorar a IA. */
export interface RelatedContext {
  id: string;
  title: string;
  summary: string;
  body: string;
}

/** Contexto que os helpers recebem para gerar uma proposta. */
export interface EntityDraftContext {
  id: string;
  title: string;
  section: string;
  purpose: string;
  instructions?: string;
  currentBody: string;
  related: RelatedContext[];
}

/** Uma proposta de conteudo: resumo do card + corpo Markdown. */
export interface EntityDraft {
  summary: string;
  body: string;
}

/** Resolve o provider + modelo. Lanca se a chave faltar (defesa em profundidade). */
function resolveModel() {
  const apiKey = config.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY ausente: a IA nao esta configurada.");
  }
  const anthropic = createAnthropic({ apiKey, baseURL: "https://api.kpalabz.com/v1" });
  return { anthropic, languageModel: anthropic(AI_MODEL_ID) };
}

const draftSchema = z.object({
  summary: z
    .string()
    .describe("Resumo de 1-2 frases, em pt-BR, que aparece no card."),
  body: z
    .string()
    .describe(
      "Corpo Markdown completo em pt-BR, comecando por um H1 igual ao titulo " +
        "e preservando os headings de secao existentes.",
    ),
});

const DRAFT_SYSTEM = [
  "Voce e um agente do BusinessOS, um OS de decisao para founders.",
  "Voce PROPOE conteudo; o founder aprova. Escreva sempre em pt-BR, direto e concreto.",
  "Regras do corpo: comece com um H1 exatamente igual ao titulo da entidade;",
  "preserve os headings de secao existentes (nao invente estrutura nova);",
  "preencha o que estiver vago a partir do contexto; nao invente fatos ausentes do contexto.",
].join(" ");

/** Monta o bloco de contexto (entidade atual + relacionadas) para o prompt. */
function contextBlock(ctx: EntityDraftContext): string {
  const related = ctx.related.length
    ? ctx.related
        .map(
          (r) =>
            `### ${r.title} (${r.id})\nResumo: ${r.summary || "(vazio)"}\n${r.body}`,
        )
        .join("\n\n")
    : "(nenhuma)";
  return [
    `Entidade: ${ctx.title} (id ${ctx.id}, secao ${ctx.section})`,
    `Proposito: ${ctx.purpose}`,
    ctx.instructions ? `Instrucoes: ${ctx.instructions}` : "",
    `\nConteudo atual:\n${ctx.currentBody || "(vazio)"}`,
    `\nEntidades relacionadas (contexto):\n${related}`,
  ]
    .filter(Boolean)
    .join("\n");
}

/** Propoe uma nova versao da entidade (resumo + corpo). Usado pelo "Pedir a IA". */
export async function generateEntityDraft(
  ctx: EntityDraftContext,
  userPrompt?: string,
): Promise<EntityDraft> {
  const { languageModel } = resolveModel();
  const guidance = userPrompt?.trim()
    ? `\nOrientacao do founder: ${userPrompt.trim()}`
    : "";
  const shape =
    '{"summary":"... (1-2 frases, pt-BR)...",' +
    '"body":"... (corpo Markdown, comeca com H1 = titulo, headings de secao preservados)..."}';
  const { text } = await generateText({
    model: languageModel,
    maxOutputTokens: 16384,
    providerOptions: {
      anthropic: { thinking: { type: "disabled" } },
    },
    system:
      DRAFT_SYSTEM +
      " Sua resposta DEVE ser SOMENTE um objeto JSON valido no formato " +
      shape + ". NAO escreva prosa, NAO use cercas ```json, NAO escreva em outros idiomas. " +
      "Feche TODAS as chaves. O `body` deve ser uma string com \\n preservado (use \\n literal nas quebras de linha).",
    prompt:
      `Proponha uma nova versao desta entidade.${guidance}\n\n` +
      contextBlock(ctx),
  });
  let parsed: unknown;
  try {
    parsed = extractJson(text);
  } catch {
    // Fallback: a IA devolveu texto. Encapsula em summary/body minimo para nao
    // quebrar o app. O founder recebe um rascunho e pode editar.
    return {
      summary: "Proposta da IA (formato nao-JSON). Edite para ajustar.",
      body: typeof text === "string" ? text : "",
    };
  }
  // Sanitiza tipos antes do zod parse (a IA pode devolver numeros onde
  // esperamos string, ou campos faltando).
  const obj = (parsed && typeof parsed === "object" ? parsed : {}) as Record<string, unknown>;
  const safe = {
    summary: typeof obj.summary === "string" ? obj.summary : obj.summary == null ? "" : String(obj.summary),
    body: typeof obj.body === "string" ? obj.body : obj.body == null ? "" : String(obj.body),
  };
  try {
    return draftSchema.parse(safe);
  } catch (e) {
    console.error("[generateEntityDraft] draftSchema falhou:", e instanceof Error ? e.message : e);
    return {
      summary: safe.summary || "Proposta da IA (campos invalidos).",
      body: safe.body || "",
    };
  }
}

/** Sintetiza um briefing a partir das respostas do questionario (heading -> resposta). */
export async function generateBriefingDraft(
  ctx: EntityDraftContext,
  answers: { heading: string; answer: string }[],
): Promise<EntityDraft> {
  const { languageModel } = resolveModel();
  const block = answers
    .map((a) => `## ${a.heading}\n${a.answer.trim() || "(sem resposta)"}`)
    .join("\n\n");
  const shape =
    '{"summary":"... (1-2 frases, pt-BR)...",' +
    '"body":"... (corpo Markdown, comeca com H1 = titulo, headings de secao preservados)..."}';
  const { text } = await generateText({
    model: languageModel,
    maxOutputTokens: 16384,
    providerOptions: {
      anthropic: { thinking: { type: "disabled" } },
    },
    system:
      DRAFT_SYSTEM +
      " Sua resposta DEVE ser SOMENTE um objeto JSON valido no formato " +
      shape + ". NAO escreva prosa, NAO use cercas ```json, NAO escreva em outros idiomas. " +
      "Feche TODAS as chaves. O `body` deve ser uma string com \\n preservado (use \\n literal nas quebras de linha).",
    prompt:
      "Sintetize um briefing claro a partir das respostas do founder abaixo. " +
      "Organize o corpo pelas secoes do questionario, preenchendo o que estiver vago.\n\n" +
      `Respostas:\n\n${block}\n\n---\n${contextBlock(ctx)}`,
  });
  let parsed: unknown;
  try {
    parsed = extractJson(text);
  } catch {
    return {
      summary: "Briefing da IA (formato nao-JSON). Edite para ajustar.",
      body: typeof text === "string" ? text : "",
    };
  }
  const obj = (parsed && typeof parsed === "object" ? parsed : {}) as Record<string, unknown>;
  const safe = {
    summary: typeof obj.summary === "string" ? obj.summary : obj.summary == null ? "" : String(obj.summary),
    body: typeof obj.body === "string" ? obj.body : obj.body == null ? "" : String(obj.body),
  };
  try {
    return draftSchema.parse(safe);
  } catch (e) {
    console.error("[generateBriefingDraft] draftSchema falhou:", e instanceof Error ? e.message : e);
    return {
      summary: safe.summary || "Briefing da IA (campos invalidos).",
      body: safe.body || "",
    };
  }
}

/**
 * Extrai o objeto JSON de uma resposta em texto.
 *
 * Tolerante a: cercas ```json, truncamento, ruido do kpalabz dentro de strings.
 * Estrategia em 4 camadas (cada camada e uma "rede" mais permissiva):
 *   1) Tira fence ```json se existir e tenta JSON.parse direto.
 *   2) Varre janelas que comecam com `{"kpis":` e terminam no ultimo `}` do texto.
 *   3) Corta o texto no(s) primeiros(s) bloco(s) `{"kpis":` e `{"insights":` e
 *      fecha chaves/colchetes abertos.
 *   4) Procura o PRIMEIRO `{` valido e usa o log de fechamentos.
 */
function extractJson(text: string): unknown {
  const s = text.trim();
  if (!s) throw new Error("Resposta vazia da IA.");

  // 1) fence ```json
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence?.[1]) {
    try { return JSON.parse(fence[1]); } catch { /* tenta proxima camada */ }
  }

  // 2) se o texto inteiro parseia, usa direto
  try { return JSON.parse(s); } catch { /* continua */ }

  // 3) janela ancorada em {"kpis": (nosso schema comeca com isso)
  const kpisIdx = s.indexOf('{"kpis"');
  if (kpisIdx >= 0) {
    const lastClose = s.lastIndexOf("}");
    for (let end = lastClose; end > kpisIdx; end = s.lastIndexOf("}", end - 1)) {
      const window = s.slice(kpisIdx, end + 1);
      try { return JSON.parse(window); } catch { /* tenta `}` anterior */ }
    }
  }

  // 4) achar o primeiro `{` parseavel. Varia o `end` ate dar.
  const firstBrace = s.indexOf("{");
  if (firstBrace >= 0) {
    const lastClose = s.lastIndexOf("}");
    for (let end = lastClose; end > firstBrace; end = s.lastIndexOf("}", end - 1)) {
      const window = s.slice(firstBrace, end + 1);
      try { return JSON.parse(window); } catch { /* continua */ }
    }

    // 5) Se ainda nao parseou: fecha chaves/colchetes abertos e tira possivel
    //    "lixo" no final (kpalabz as vezes injeta caracteres de controle ou
    //    texto solto). Trabalhamos na maior substring que comece com `{`.
    let fixed = s.slice(firstBrace, lastClose > firstBrace ? lastClose + 1 : s.length);
    // remove lixo no final depois de qualquer string valida
    const opens: string[] = [];
    let inString = false;
    let escape = false;
    for (const ch of fixed) {
      if (escape) { escape = false; continue; }
      if (ch === "\\") { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === "{") opens.push("}");
      else if (ch === "[") opens.push("]");
      else if (ch === "}" || ch === "]") opens.pop();
    }
    if (inString) {
      // ultima string nao foi fechada: termina ela
      fixed += '"';
    }
    fixed += opens.reverse().join("");
    try { return JSON.parse(fixed); } catch { /* cai no throw final */ }
  }

  throw new Error("A IA nao retornou um JSON de relatorio valido.");
}

/**
 * Pesquisa dados reais na web (web search da Anthropic) e propoe o bloco `report`
 * (KPIs + insights) validado contra `reportSchema`. Usado pelo "Gerar relatorio".
 */
export async function generateReportDraft(
  ctx: EntityDraftContext,
): Promise<Report> {
  const { anthropic, languageModel } = resolveModel();
  const shape =
    '{"kpis":[{"label":"...","value":"...","kind":"fact","source_label":"estimativa interna","note":"..."},' +
    '{"label":"...","value":"...","kind":"goal","note":"..."}],' +
    '"insights":[{"text":"...","source_label":"..."}]}';
  const { text } = await generateText({
    model: languageModel,
    maxOutputTokens: 16384,
    providerOptions: {
      anthropic: { thinking: { type: "disabled" } },
    },
    system:
      "Voce e um agente de relatorio do BusinessOS. Sua resposta DEVE ser SOMENTE um " +
      "objeto JSON valido. Regras absolutas (senao o sistema quebra):\n" +
      "1. Responda EXCLUSIVAMENTE em portugues do Brasil. Nunca use outros idiomas.\n" +
      "2. NAO escreva prosa, explicacoes, comentarios, fenced blocks ```, ou qualquer " +
      "caractere fora do JSON.\n" +
      "3. Feche TODAS as chaves {} e colchetes [] do JSON. Conte antes de terminar.\n" +
      "4. Para cada KPI 'fact', `value` DEVE ser um numero/percentual/string CURTA " +
      "(ex.: \"R$ 4,2 bi\", \"23%\", \"12 clientes/mês\"). NAO use descricoes longas " +
      "no campo `value` (use `note` para isso).\n" +
      "5. Para cada KPI 'goal', `value` deve ser uma meta concreta com prazo ou " +
      "quantidade (ex.: \"10 entrevistas em 30 dias\").\n" +
      "6. `source_label` para KPIs 'fact' e insights sem URL externa: escreva " +
      "\"estimativa interna\" ou \"contexto da entidade\".\n" +
      "7. Limite: ate 6 KPIs e 4 insights. Prefira qualidade a quantidade.",
    prompt:
      "Gere o relatorio (KPIs + insights) para a entidade abaixo. " +
      "Use o contexto fornecido para ancorar os numeros (mesmo que sejam estimativas " +
      "marcadas como tal). Responda com UM unico objeto JSON valido, " +
      "no formato:\n" +
      `${shape}\n\n` +
      `Contexto da entidade:\n${contextBlock(ctx)}`,
  });

  let parsed: unknown;
  try {
    parsed = extractJson(text);
  } catch (e) {
    console.error("[generateReportDraft] extractJson falhou:", e instanceof Error ? e.message : e);
    // Tenta extrair apenas o que conseguimos e gravar o report como vazio
    // (o founder pode editar manualmente).
    parsed = { kpis: [], insights: [] };
  }

  // Sanitiza o que conseguimos: o kpalabz as vezes devolve `kind` invalido
  // (ex.: "unknown") ou KPIs com `value` numero em vez de string. O zod
  // schema so aceita kind in ['fact','goal'] e value:string.
  parsed = sanitizeReport(parsed);

  let validated: Report;
  try {
    validated = reportSchema.parse(parsed) as Report;
  } catch (e) {
    console.error("[generateReportDraft] reportSchema falhou:", e instanceof Error ? e.message : e);
    // Ultimo fallback: report vazio (o founder edita manualmente)
    validated = { kpis: [], insights: [] } as Report;
  }
  return {
    ...validated,
    generated_by: "ai",
    generated_at: new Date().toISOString().slice(0, 10),
  };
}

/** Normaliza o que veio do kpalabz para casar com o reportSchema. */
function sanitizeReport(input: unknown): unknown {
  if (!input || typeof input !== "object") return { kpis: [], insights: [] };
  const obj = input as Record<string, unknown>;
  const safeKind = (k: unknown): "fact" | "goal" =>
    k === "fact" || k === "goal" ? k : "fact";
  const asString = (v: unknown): string =>
    v == null ? "" : typeof v === "string" ? v : String(v);
  const safeKpi = (k: unknown) => {
    if (!k || typeof k !== "object") return null;
    const kk = k as Record<string, unknown>;
    return {
      label: asString(kk.label) || "(sem rotulo)",
      value: asString(kk.value) || "n/d",
      kind: safeKind(kk.kind),
      ...(kk.source ? { source: asString(kk.source) } : {}),
      ...(kk.source_label ? { source_label: asString(kk.source_label) } : {}),
      ...(kk.note ? { note: asString(kk.note) } : {}),
    };
  };
  const safeInsight = (i: unknown) => {
    if (!i || typeof i !== "object") return null;
    const ii = i as Record<string, unknown>;
    return {
      text: asString(ii.text) || "(sem texto)",
      ...(ii.source ? { source: asString(ii.source) } : {}),
      ...(ii.source_label ? { source_label: asString(ii.source_label) } : {}),
    };
  };
  return {
    ...(obj.generated_at ? { generated_at: asString(obj.generated_at) } : {}),
    ...(obj.generated_by ? { generated_by: asString(obj.generated_by) } : {}),
    kpis: Array.isArray(obj.kpis)
      ? (obj.kpis.map(safeKpi).filter((x) => x != null) as Array<
          ReturnType<typeof safeKpi>
        >)
      : [],
    insights: Array.isArray(obj.insights)
      ? (obj.insights.map(safeInsight).filter((x) => x != null) as Array<
          ReturnType<typeof safeInsight>
        >)
      : [],
  };
}
