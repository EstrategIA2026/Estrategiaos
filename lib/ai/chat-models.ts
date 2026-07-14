/**
 * Catalogo de modelos do chat da pagina Principal (client-safe: sem `server-only`,
 * pode ser importado no seletor de UI e no provider/route no servidor).
 *
 * Allowlist central: a UI so oferece estes ids e a rota `/api/chat` valida contra
 * eles antes de resolver o modelo — nunca confia num id arbitrario vindo do body.
 *
 * Os modelos aqui listados sao os expostos pelo gateway kpalabz via API Anthropic
 * Messages (verificado em https://api.kpalabz.com/v1/models).
 */
export const CHAT_MODELS = [
  { id: "claude-sonnet-5", label: "Sonnet 5", hint: "Equilibrado (padrao)" },
  { id: "claude-fable-5", label: "Fable 5", hint: "Mais capaz" },
  { id: "claude-opus-4-8", label: "Opus 4.8", hint: "Topo de gama" },
  { id: "claude-opus-4-7", label: "Opus 4.7", hint: "Premium" },
  { id: "claude-sonnet-4-6", label: "Sonnet 4.6", hint: "Versao anterior" },
  { id: "claude-haiku-4-5", label: "Haiku 4.5", hint: "Rapido e economico" },
] as const;

export type ChatModelId = (typeof CHAT_MODELS)[number]["id"];

export const CHAT_MODEL_IDS = CHAT_MODELS.map((m) => m.id) as ChatModelId[];

/** Modelo padrao quando nada e selecionado (ou o id recebido e invalido). */
export const DEFAULT_CHAT_MODEL_ID: ChatModelId = "claude-sonnet-5";

/** Type guard: `v` e um id de modelo permitido? */
export function isChatModelId(v: unknown): v is ChatModelId {
  return typeof v === "string" && (CHAT_MODEL_IDS as string[]).includes(v);
}

/** Rotulo curto de um id (fallback: o proprio id). */
export function chatModelLabel(id: string): string {
  return CHAT_MODELS.find((m) => m.id === id)?.label ?? id;
}