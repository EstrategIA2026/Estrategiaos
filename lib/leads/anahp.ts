/**
 * Adapter ANHP (Associacao Nacional de Hospitais Privados).
 *
 * Raspa a pagina /associados da ANHP para pegar a lista oficial de hospitais
 * privados do Brasil (162+ hospitais em 2026). Cada item vira {name, slug, url}.
 *
 * Cache leve em memoria por 24h (a lista muda raramente).
 */

export interface AnahpHospital {
  /** Nome humanizado (ex: "Hospital Alemao Oswaldo Cruz"). */
  name: string;
  /** Slug URL (ex: "hospital-alemao-oswaldo-cruz"). */
  slug: string;
  /** URL da pagina individual do hospital no site da ANHP. */
  url: string;
}

const ANHP_URL = "https://www.anahp.com.br/associados/";

let cache: { at: number; hospitals: AnahpHospital[] } | null = null;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

/**
 * Busca a lista de hospitais associados da ANHP.
 * Devolve ate `limit` hospitais (default todos).
 */
export async function listAnahpHospitals(limit = 200): Promise<AnahpHospital[]> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return cache.hospitals.slice(0, limit);
  }

  const res = await fetch(ANHP_URL, {
    headers: { "user-agent": "BusinessOS/1.0 (Estrateg[IA])" },
  });
  if (!res.ok) {
    throw new Error(`ANHP retornou ${res.status}`);
  }
  const html = await res.text();

  // Extrai todos os links /associados/hospital-*/ e converte em items.
  const re = /href="https:\/\/www\.anahp\.com\.br\/associados\/(hospital-[^"\/]+)\/?/g;
  const seen = new Set<string>();
  const hospitals: AnahpHospital[] = [];
  for (const m of html.matchAll(re)) {
    const slug = m[1];
    if (seen.has(slug)) continue;
    seen.add(slug);
    // Slug "hospital-alemao-oswaldo-cruz" -> "Hospital Alemao Oswaldo Cruz"
    const name = slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    hospitals.push({
      name,
      slug,
      url: `https://www.anahp.com.br/associados/${slug}/`,
    });
  }

  cache = { at: Date.now(), hospitals };
  return hospitals.slice(0, limit);
}

/**
 * Filtra os hospitais por uma regiao/UF. Mapeia o final do slug para
 * uma sigla de UF (ex: "...sao-paulo-sp" -> "SP"). O `stateHint` do ICP
 * (ex: "Ceara", "Nordeste") e convertido para UFs.
 */
const REGION_TO_UFS: Record<string, string[]> = {
  norte: ["AC", "AP", "AM", "RR", "PA", "RO", "TO"],
  nordeste: ["MA", "PI", "CE", "RN", "PB", "PE", "AL", "SE", "BA"],
  "centro-oeste": ["MT", "MS", "GO", "DF"],
  sudeste: ["MG", "ES", "RJ", "SP"],
  sul: ["PR", "SC", "RS"],
};
const UF_TO_SLUG: Record<string, string> = {
  AC: "ac", AL: "al", AP: "ap", AM: "am", BA: "ba",
  CE: "ce", DF: "df", ES: "es", GO: "go", MA: "ma",
  MT: "mt", MS: "ms", MG: "mg", PA: "pa", PB: "pb",
  PR: "pr", PE: "pe", PI: "pi", RJ: "rj", RN: "rn",
  RS: "rs", RO: "ro", RR: "rr", SC: "sc", SP: "sp",
  SE: "se", TO: "to",
};

export function filterByRegion(
  hospitals: AnahpHospital[],
  regionHint: string | null,
): AnahpHospital[] {
  if (!regionHint) return hospitals;
  const lower = regionHint.toLowerCase().trim();
  // 1) Match por nome de regiao.
  for (const [region, ufs] of Object.entries(REGION_TO_UFS)) {
    if (lower.includes(region)) {
      const allowed = new Set(ufs);
      return hospitals.filter((h) => {
        const uf = h.slug.split("-").pop()?.toUpperCase();
        return uf && allowed.has(uf);
      });
    }
  }
  // 2) Match por sigla de UF direta.
  const uf = regionHint.toUpperCase().trim();
  if (UF_TO_SLUG[uf]) {
    return hospitals.filter((h) => h.slug.endsWith(`-${UF_TO_SLUG[uf]}`));
  }
  return hospitals;
}
