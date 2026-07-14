/**
 * Fontes publicas onde coordenadores de nucleo hospitalar aparecem em publico.
 *
 * Tavily ja indexa o suficiente para trazer snippets dessas paginas quando a
 * busca inclui os dominios via `includeDomains`. Evita o custo/licenca de
 * APIs pagas (LinkedIn Sales Navigator, Proxycurl) e respeita os TOS de cada
 * plataforma (leitura de pagina publica e OK).
 *
 * Adicione ou remova dominios conforme o cluster da founder muda.
 */
export const LEAD_DOMAINS = [
  // Redes sociais publicas.
  "linkedin.com",
  "instagram.com",
  "youtube.com",
  "facebook.com",
  // Sites institucionais brasileiros (saude + educacao).
  "gov.br",
  "fiocruz.br",
  "scielo.br",
  "scielo.org",
  "cns.bvs.br",
  "edu.br",
  // Bases academicas e profissionais.
  "lattes.cnpq.br",
  "scholar.google.com",
  "researchgate.net",
  // Sites de hospitais / associacoes / eventos.
  "hospital",
  "saude",
  "enfermagem",
];

/** Query adicional Tavily para focar em pessoas/coordenadores. Curta (max ~100 chars) para nao estourar o limite de 400 da Tavily. */
export const LEAD_QUERY_SUFFIX =
  "coordenador enfermeiro NEP CCIH Qualidade hospital perfil LinkedIn";
