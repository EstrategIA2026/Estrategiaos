/**
 * Persona de apresentação dos subagentes: um nome amigável e um hash estável,
 * DERIVADOS do slug — puramente presentacional. Nada aqui é gravado nos
 * arquivos `.claude/agents/<slug>.md` (que definem o runtime do agente); é só
 * a camada de UI que dá "cara e nome" a cada card/avatar.
 *
 * Os nomes sao NAO-humanos — combinam com a estetica Estrateg[IA] (robos/
 * pixel/cyberpunk). Inventados para soar como identidade de maquina.
 */

/** Nomes curados para os agentes conhecidos (slug -> nome de robo). */
const NAMES: Record<string, string> = {
  "cash-flow": "Croma",
  "context-linter": "Vetor",
  "founder-coach": "Nimbus",
  icp: "Pulso",
  "market-map": "Atlas",
  "offer-strategist": "Quark",
  "problem-magnet": "Imã",
  "seed-assistant": "Semente",
  summarizer: "Eco",
  "validation-synth": "Bit",
  "value-thesis": "Nexo",
};

/**
 * Nome amigavel do agente. Usa o mapa curado; para slugs novos, deriva um nome
 * baseado na parte do slug (ex.: `growth-hacker` -> `Growth`).
 */
export function agentName(slug: string): string {
  const known = NAMES[slug];
  if (known) return known;
  const first = slug.split("-")[0] ?? slug;
  return first.charAt(0).toUpperCase() + first.slice(1);
}

/** Hash deterministico (djb2) do slug — semente estavel para o avatar. */
export function agentSeed(slug: string): number {
  let h = 5381;
  for (let i = 0; i < slug.length; i++) {
    h = ((h << 5) + h + slug.charCodeAt(i)) >>> 0;
  }
  return h >>> 0;
}
