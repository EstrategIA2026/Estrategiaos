/**
 * Cliente Hunter.io — busca emails de decisores em uma empresa.
 * Docs: https://hunter.io/api-documentation
 *
 * Endpoints usados:
 *   - Domain Search: lista todos os emails de uma empresa
 *   - Email Finder: acha o email de uma pessoa especifica
 */

export interface HunterPerson {
  /** Nome completo. */
  fullName: string;
  /** Email. */
  email: string;
  /** Cargo. */
  position: string | null;
  /** Departamento (engineering, marketing, etc). */
  department: string | null;
  /** Seniority (executive, senior, junior). */
  seniority: string | null;
  /** LinkedIn URL (opcional). */
  linkedin: string | null;
  /** Empresa. */
  company: string;
  /** Fonte ("hunter"). */
  source: string;
}

export interface HunterDomain {
  /** Dominio (ex.: "hospitalalvorada.com.br"). */
  domain: string;
  /** Nome da empresa. */
  organization: string | null;
  /** Setor. */
  industry: string | null;
  /** Tamanho estimado. */
  size: string | null;
  /** Pais. */
  country: string | null;
  /** Estado. */
  state: string | null;
  /** Cidade. */
  city: string | null;
  /** LinkedIn URL da empresa. */
  linkedin: string | null;
  /** Twitter. */
  twitter: string | null;
  /** Lista de pessoas/emails achadas. */
  people: HunterPerson[];
}

/**
 * Busca pessoas de uma empresa pelo dominio (ex: "hospitalalvorada.com.br").
 * Devolve ate 10 pessoas + dados da empresa.
 */
export async function hunterDomainSearch(
  domain: string,
  options: { department?: string[]; seniority?: string[]; limit?: number } = {},
): Promise<HunterDomain> {
  const apiKey = process.env.HUNTER_API_KEY;
  if (!apiKey) {
    throw new Error("HUNTER_API_KEY nao configurada.");
  }

  const params = new URLSearchParams({ domain, api_key: apiKey });
  if (options.department?.length) params.set("department", options.department.join(","));
  if (options.seniority?.length) params.set("seniority", options.seniority.join(","));
  if (options.limit) params.set("limit", String(Math.min(options.limit, 100)));

  const res = await fetch(
    `https://api.hunter.io/v2/domain-search?${params.toString()}`,
  );
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Hunter ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = await res.json();
  const d = data.data ?? {};
  return {
    domain: d.domain ?? domain,
    organization: d.organization ?? null,
    industry: d.industry ?? null,
    size: d.size ?? null,
    country: d.country ?? null,
    state: d.state ?? null,
    city: d.city ?? null,
    linkedin: d.linkedin ?? null,
    twitter: d.twitter ?? null,
    people: (d.emails ?? []).map(
      (e: { value: string; first_name?: string; last_name?: string; position?: string; department?: string; seniority?: string; linkedin?: string | null }) => ({
        fullName: [e.first_name, e.last_name].filter(Boolean).join(" "),
        email: e.value,
        position: e.position ?? null,
        department: e.department ?? null,
        seniority: e.seniority ?? null,
        linkedin: e.linkedin ?? null,
        company: d.organization ?? domain,
        source: "Hunter.io",
      }),
    ),
  };
}

/**
 * Acha o email de UMA pessoa especifica numa empresa.
 * @param firstName nome
 * @param lastName sobrenome
 * @param domain empresa (sem @)
 */
export async function hunterEmailFinder(
  firstName: string,
  lastName: string,
  domain: string,
): Promise<{ email: string | null; score: number }> {
  const apiKey = process.env.HUNTER_API_KEY;
  if (!apiKey) throw new Error("HUNTER_API_KEY nao configurada.");

  const params = new URLSearchParams({
    api_key: apiKey,
    domain,
    first_name: firstName,
    last_name: lastName,
  });
  const res = await fetch(
    `https://api.hunter.io/v2/email-finder?${params.toString()}`,
  );
  if (!res.ok) return { email: null, score: 0 };
  const d = await res.json();
  const e = d.data?.email ?? null;
  return { email: e, score: d.data?.score ?? 0 };
}
