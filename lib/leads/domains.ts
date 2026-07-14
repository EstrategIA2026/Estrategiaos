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

/** Query adicional Tavily para focar em pessoas/coordenadores. */
export const LEAD_QUERY_SUFFIX =
  " enfermeiro coordenador NEP CCIH Qualidade hospital gestao saude LinkedIn instagram perfil contato";
