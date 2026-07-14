/**
 * Cliente Tavily — busca empresas na web para prospeccao.
 * Docs: https://docs.tavily.com
 */

export interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score?: number;
}

interface TavilyResponse {
  results: TavilyResult[];
  answer?: string;
  query?: string;
}

interface SearchOptions {
  /** Quantidade de resultados (1-20). */
  maxResults?: number;
  /** "basic" (rapido) | "advanced" (mais contexto). */
  searchDepth?: "basic" | "advanced";
  /** Temas a incluir. */
  includeDomains?: string[];
  /** Temas a excluir. */
  excludeDomains?: string[];
  /** Tavily AI answer blob (nao usamos). */
  includeAnswer?: boolean;
}

/**
 * Faz uma busca na web via Tavily.
 *
 * @param query Texto da busca (natural language, em pt-BR funciona)
 * @param options maxResults (default 5), searchDepth (advanced para melhor contexto)
 */
export async function tavily(
  query: string,
  maxResults = 5,
  options: SearchOptions = {},
): Promise<TavilyResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error(
      "TAVILY_API_KEY nao configurada. Adicione em .env.local.",
    );
  }

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      max_results: maxResults,
      search_depth: options.searchDepth ?? "advanced",
      include_answer: false,
      include_raw_content: false,
      include_domains: options.includeDomains,
      exclude_domains: options.excludeDomains,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(
      `Tavily retornou ${response.status}: ${errText.slice(0, 200)}`,
    );
  }

  const data = (await response.json()) as TavilyResponse;
  return data.results ?? [];
}
