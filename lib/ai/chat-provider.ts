import "server-only";

import { createAnthropic } from "@ai-sdk/anthropic";
import type { LanguageModel } from "ai";

import { config, AI_ENABLED } from "@/lib/config";
import { DEFAULT_CHAT_MODEL_ID, isChatModelId } from "@/lib/ai/chat-models";

/**
 * Provider do chat da pagina Principal (SPEC). Usa Anthropic via
 * `@ai-sdk/anthropic`, apontado para o gateway kpalabz (`baseURL`).
 * Espelha o padrao de `lib/ai/provider.ts::resolveModel()`: lazy, le a chave
 * do `config` validado e lanca se ausente.
 *
 * "Cabo solto": sem `ANTHROPIC_API_KEY`, `CHAT_ENABLED` e falso e a rota
 * `/api/chat` responde 503 antes de tocar aqui. O throw abaixo e defesa em
 * profundidade. (Reaproveita a flag `AI_ENABLED` por simplicidade — mesmo
 * cabo solto, mesma chave.)
 */

/** Modelo padrao do chat (re-export do catalogo client-safe). */
export const CHAT_MODEL_ID = DEFAULT_CHAT_MODEL_ID;

/** Alias semantico: a chave `ANTHROPIC_API_KEY` tambem liga o chat. */
export const CHAT_ENABLED = AI_ENABLED;

/**
 * Resolve o modelo de linguagem. Lanca se a chave faltar.
 * `modelId` (do body do chat) so e aceito se estiver na allowlist de
 * `chat-models`; qualquer outra coisa cai no padrao.
 */
export function resolveChatModel(modelId?: string): LanguageModel {
  if (!CHAT_ENABLED) {
    throw new Error(
      "ANTHROPIC_API_KEY ausente: o chat da pagina Principal nao esta configurado.",
    );
  }
  const id = isChatModelId(modelId) ? modelId : DEFAULT_CHAT_MODEL_ID;
  const anthropic = createAnthropic({
    apiKey: config.ANTHROPIC_API_KEY,
    baseURL: "https://api.kpalabz.com/v1",
  });
  return anthropic(id);
}