import type * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Avatar pixel-art Estrateg[IA] — 11 robos PIXELADOS DISTINTOS.
 *
 * Cada slug tem um desenho UNICO (forma do corpo, bracos, olhos, pernas),
 * nao apenas cor diferente. Fundo transparente (sem `bg` opaco) para que o
 * card mostre o tom Estrateg[IA] atras. SVG inline rasterizado com
 * `shape-rendering: crispEdges` para pixel perfeito em qualquer escala.
 *
 * O slug e mapeado para um ID de template (1-11) deterministico via hash
 * simples. Se quiser trocar qual desenho cada agente usa, edite o mapa
 * `ROBOT_BY_SLUG` abaixo.
 */

interface RobotDesign {
  /** Cor principal do corpo. */
  body: string;
  /** Cor de detalhes (pinca, pernas, ornamentos). */
  accent: string;
  /** Cor do fundo dos olhos. */
  face: string;
}

const PALETTES: RobotDesign[] = [
  // 00 — laranja Estrateg[IA] (padrao do site)
  { body: "#E97858", accent: "#E63B16", face: "#F2F0EC" },
  // 01 — ciano
  { body: "#5DD4D4", accent: "#0E8577", face: "#F2F0EC" },
  // 02 — magenta
  { body: "#F07AA6", accent: "#C42A6B", face: "#F2F0EC" },
  // 03 — azul
  { body: "#69A8F0", accent: "#1E6FCC", face: "#F2F0EC" },
  // 04 — verde
  { body: "#77C888", accent: "#2E8B45", face: "#F2F0EC" },
  // 05 — roxo
  { body: "#B87AE0", accent: "#7E33B0", face: "#F2F0EC" },
  // 06 — branco
  { body: "#F2F0EC", accent: "#9A938B", face: "#0B0A09" },
  // 07 — amarelo
  { body: "#F6C73C", accent: "#D9691A", face: "#F2F0EC" },
];

const SIZE = 64; // tamanho logico do SVG (px do pixel = 4)
const PX = 4;

/** Desenho: gruda um retangulo de cor numa celula do grid 16x16. */
function px(x: number, y: number, fill: string): React.JSX.Element {
  return (
    <rect
      key={`${x}-${y}`}
      x={x * PX}
      y={y * PX}
      width={PX}
      height={PX}
      fill={fill}
    />
  );
}

// Cada design = funcao que recebe (body, accent, face) e devolve array de pixels.
// Tamanho logico: 16x16 grid. Origem (0,0) = canto superior esquerdo.

type Pixel = React.JSX.Element;
type DesignFn = (body: string, accent: string, face: string) => Pixel[];

/** 1. Carangueijo Estrateg[IA] — 4 pernas + 2 pinças + antena. */
const crab: DesignFn = (b, a, f) => {
  const out: Pixel[] = [];
  // corpo (linhas 4-11), 8 colunas centradas (cols 4-11)
  for (let y = 4; y <= 11; y++) {
    for (let x = 4; x <= 11; x++) {
      out.push(px(x, y, b));
    }
  }
  // pinças (cols 2-3, 12-13)
  for (let y = 5; y <= 8; y++) {
    out.push(px(2, y, a));
    out.push(px(3, y, a));
    out.push(px(12, y, a));
    out.push(px(13, y, a));
  }
  // olhos (linha 6, cols 6 e 9)
  out.push(px(6, 6, f));
  out.push(px(9, 6, f));
  // boca (linha 8, cols 5-10)
  for (let x = 5; x <= 10; x++) out.push(px(x, 8, f));
  // pernas (linhas 12-13)
  out.push(px(5, 12, a)); out.push(px(5, 13, a));
  out.push(px(7, 12, a));
  out.push(px(8, 12, a)); out.push(px(9, 13, a));
  out.push(px(10, 13, a));
  return out;
};

/** 2. Robô retangular com olho único e antena dupla. */
const robot1eye: DesignFn = (b, a, f) => {
  const out: Pixel[] = [];
  // corpo (linhas 4-11)
  for (let y = 4; y <= 11; y++) {
    for (let x = 4; x <= 11; x++) out.push(px(x, y, b));
  }
  // antena dupla (linhas 1-3)
  out.push(px(5, 1, a)); out.push(px(5, 2, a)); out.push(px(5, 3, a));
  out.push(px(10, 1, a)); out.push(px(10, 2, a)); out.push(px(10, 3, a));
  // olho unico grande (linhas 6-8, cols 6-9)
  for (let y = 6; y <= 8; y++) {
    for (let x = 6; x <= 9; x++) out.push(px(x, y, f));
  }
  // boca (linha 10, cols 5-10)
  for (let x = 5; x <= 10; x++) out.push(px(x, 10, f));
  // pes (linhas 12-13)
  out.push(px(5, 12, a)); out.push(px(5, 13, a));
  out.push(px(7, 12, a)); out.push(px(8, 13, a));
  out.push(px(10, 12, a)); out.push(px(10, 13, a));
  return out;
};

/** 3. Alien triangular — corpo triangular com 3 olhos. */
const alien3eye: DesignFn = (b, a, f) => {
  const out: Pixel[] = [];
  // corpo: triangulo apontando pra baixo (linhas 3-11)
  for (let y = 3; y <= 11; y++) {
    const half = Math.min(y - 3, 6);
    for (let x = 7 - half; x <= 7 + half; x++) {
      if (x >= 0 && x <= 15) out.push(px(x, y, b));
    }
  }
  // antena (linha 1, col 7; linha 2, col 7)
  out.push(px(7, 1, a)); out.push(px(7, 2, a));
  // 3 olhos (linha 5, cols 5, 7, 9)
  out.push(px(5, 5, f)); out.push(px(7, 5, f)); out.push(px(9, 5, f));
  // boca (linha 8, col 6-8)
  out.push(px(6, 8, f)); out.push(px(7, 8, f)); out.push(px(8, 8, f));
  return out;
};

/** 4. Robô redondo com 2 olhos grandes e orelhas. */
const robot2eye: DesignFn = (b, a, f) => {
  const out: Pixel[] = [];
  // corpo arredondado (cols 5-10, linhas 4-11)
  const rows = [4, 5, 6, 7, 8, 9, 10, 11];
  const widths = [4, 6, 6, 6, 6, 6, 6, 4];
  for (let i = 0; i < rows.length; i++) {
    const y = rows[i];
    const w = widths[i];
    const start = 8 - Math.floor(w / 2);
    for (let x = start; x < start + w; x++) out.push(px(x, y, b));
  }
  // orelhas (linhas 5-8, cols 4 e 11)
  for (let y = 5; y <= 8; y++) {
    out.push(px(4, y, a));
    out.push(px(11, y, a));
  }
  // olhos grandes (linhas 5-7, cols 5-6 e 9-10)
  for (let y = 5; y <= 7; y++) {
    out.push(px(5, y, f)); out.push(px(6, y, f));
    out.push(px(9, y, f)); out.push(px(10, y, f));
  }
  // boca sorridente (linha 9, cols 6-9)
  out.push(px(6, 9, f)); out.push(px(7, 9, f));
  out.push(px(8, 9, f)); out.push(px(9, 9, f));
  return out;
};

/** 5. Octopus — cabeça redonda com 8 tentáculos. */
const octopus: DesignFn = (b, a, f) => {
  const out: Pixel[] = [];
  // cabeça redonda (cols 5-10, linhas 2-8)
  const rows = [2, 3, 4, 5, 6, 7, 8];
  const widths = [2, 4, 6, 6, 6, 6, 2];
  for (let i = 0; i < rows.length; i++) {
    const w = widths[i];
    const start = 8 - Math.floor(w / 2);
    for (let x = start; x < start + w; x++) out.push(px(x, rows[i], b));
  }
  // olhos (linha 5, cols 6-7 e 8-9)
  out.push(px(6, 5, f)); out.push(px(7, 5, f));
  out.push(px(8, 5, f)); out.push(px(9, 5, f));
  // boca (linha 7, cols 7-8)
  out.push(px(7, 7, f)); out.push(px(8, 7, f));
  // tentáculos (linhas 9-14, alternando cols)
  out.push(px(4, 9, a)); out.push(px(4, 10, a));
  out.push(px(6, 9, a)); out.push(px(6, 10, a)); out.push(px(5, 11, a));
  out.push(px(8, 9, a)); out.push(px(8, 10, a));
  out.push(px(10, 9, a)); out.push(px(10, 10, a)); out.push(px(11, 11, a));
  out.push(px(12, 9, a));
  return out;
};

/** 6. Robô smile (Mitch) — alto, retangular, sorriso largo. */
const tallSmile: DesignFn = (b, a, f) => {
  const out: Pixel[] = [];
  // corpo alto (linhas 2-12, cols 5-10)
  for (let y = 2; y <= 12; y++) {
    for (let x = 5; x <= 10; x++) out.push(px(x, y, b));
  }
  // antena bolinha (linha 1, col 7-8)
  out.push(px(7, 1, a)); out.push(px(8, 1, a));
  // olhos (linhas 4-5, cols 6-7 e 8-9)
  for (let y = 4; y <= 5; y++) {
    out.push(px(6, y, f)); out.push(px(7, y, f));
    out.push(px(8, y, f)); out.push(px(9, y, f));
  }
  // sorriso largo (linhas 8-9)
  for (let x = 5; x <= 10; x++) out.push(px(x, 8, f));
  out.push(px(6, 9, f)); out.push(px(9, 9, f));
  // pes (linha 13)
  out.push(px(5, 13, a)); out.push(px(7, 13, a));
  out.push(px(8, 13, a)); out.push(px(10, 13, a));
  return out;
};

/** 7. Robô seed (semente) — corpo tipo gota com broto em cima. */
const seed: DesignFn = (b, a, f) => {
  const out: Pixel[] = [];
  // broto em cima (linha 1, col 7; linha 2, col 7; folha esquerda linha 2 col 6)
  out.push(px(7, 1, a));
  out.push(px(6, 2, a)); out.push(px(7, 2, a)); out.push(px(8, 2, a));
  // corpo em gota (linhas 3-12, mais estreito em cima)
  const widths = [4, 6, 6, 6, 6, 6, 6, 6, 6, 4];
  for (let i = 0; i < widths.length; i++) {
    const w = widths[i];
    const start = 8 - Math.floor(w / 2);
    for (let x = start; x < start + w; x++) out.push(px(x, i + 3, b));
  }
  // olhos (linha 6, cols 6 e 9)
  out.push(px(6, 6, f)); out.push(px(9, 6, f));
  // boca sorridente (linha 8, cols 6-9)
  out.push(px(6, 8, f)); out.push(px(7, 8, f));
  out.push(px(8, 8, f)); out.push(px(9, 8, f));
  return out;
};

/** 8. Robô valor (cifrão-like) — corpo com olho no centro, braços segurando cifrão. */
const valuedrop: DesignFn = (b, a, f) => {
  const out: Pixel[] = [];
  // cabeça (linhas 3-10, cols 5-10)
  for (let y = 3; y <= 10; y++) {
    for (let x = 5; x <= 10; x++) out.push(px(x, y, b));
  }
  // olho unico (linhas 5-7, cols 7-8)
  for (let y = 5; y <= 7; y++) {
    out.push(px(7, y, f)); out.push(px(8, y, f));
  }
  // pupila (col 7-8, linha 6) ja vem do `face`
  // boca sorridente (linha 9, cols 6-9)
  out.push(px(6, 9, f)); out.push(px(9, 9, f));
  out.push(px(7, 8, f)); out.push(px(8, 8, f));
  // antenna-$ (linha 1-2, col 7-8)
  out.push(px(7, 1, a)); out.push(px(8, 1, a));
  out.push(px(7, 2, a)); out.push(px(8, 2, a));
  return out;
};

/** 9. Robô eco (ondas) — corpo com varias antenas (sensor). */
const ecorobot: DesignFn = (b, a, f) => {
  const out: Pixel[] = [];
  // corpo (linhas 4-11, cols 5-10)
  for (let y = 4; y <= 11; y++) {
    for (let x = 5; x <= 10; x++) out.push(px(x, y, b));
  }
  // 3 antenas (linha 1-3)
  out.push(px(6, 1, a)); out.push(px(6, 2, a)); out.push(px(6, 3, a));
  out.push(px(8, 1, a)); out.push(px(8, 2, a)); out.push(px(8, 3, a));
  out.push(px(10, 1, a)); out.push(px(10, 2, a)); out.push(px(10, 3, a));
  // olhos (linhas 5-7, cols 5-7 e 8-10)
  out.push(px(5, 6, f)); out.push(px(6, 6, f)); out.push(px(7, 6, f));
  out.push(px(8, 6, f)); out.push(px(9, 6, f)); out.push(px(10, 6, f));
  // boca onda (linha 9, cols 5-10)
  for (let x = 5; x <= 10; x++) out.push(px(x, 9, f));
  // pes (linha 12)
  out.push(px(5, 12, a)); out.push(px(7, 12, a));
  out.push(px(8, 12, a)); out.push(px(10, 12, a));
  return out;
};

/** 10. Robô nexus (cristal/diamante) — corpo losangular. */
const nexus: DesignFn = (b, a, f) => {
  const out: Pixel[] = [];
  // losango corpo (linhas 2-12)
  const diamond = [
    { y: 2, w: 2 }, { y: 3, w: 4 }, { y: 4, w: 6 },
    { y: 5, w: 6 }, { y: 6, w: 6 }, { y: 7, w: 6 },
    { y: 8, w: 6 }, { y: 9, w: 6 }, { y: 10, w: 4 }, { y: 11, w: 2 },
  ];
  for (const r of diamond) {
    const start = 8 - Math.floor(r.w / 2);
    for (let x = start; x < start + r.w; x++) out.push(px(x, r.y, b));
  }
  // olhos (linha 6, cols 6 e 9)
  out.push(px(6, 6, f)); out.push(px(9, 6, f));
  // boca sorridente (linha 9, cols 6-9)
  out.push(px(6, 9, f)); out.push(px(7, 9, f));
  out.push(px(8, 9, f)); out.push(px(9, 9, f));
  return out;
};

/** 11. Robô market (mapa/bússola) — corpo com 4 quadrantes. */
const market: DesignFn = (b, a, f) => {
  const out: Pixel[] = [];
  // corpo (linhas 4-11, cols 5-10)
  for (let y = 4; y <= 11; y++) {
    for (let x = 5; x <= 10; x++) out.push(px(x, y, b));
  }
  // bussola no topo (linha 1-3, col 7-8, com pontinhos)
  out.push(px(7, 1, a)); out.push(px(8, 1, a));
  out.push(px(6, 2, a)); out.push(px(7, 2, f)); out.push(px(8, 2, f)); out.push(px(9, 2, a));
  out.push(px(7, 3, a)); out.push(px(8, 3, a));
  // 4 olhos (linha 5, cols 5-6 e 9-10) - forma de mapa
  out.push(px(5, 5, f)); out.push(px(6, 5, f));
  out.push(px(9, 5, f)); out.push(px(10, 5, f));
  // cruz no meio (linha 7-8, col 7-8)
  out.push(px(7, 7, f)); out.push(px(8, 7, f));
  out.push(px(7, 8, f)); out.push(px(8, 8, f));
  return out;
};

// Mapa: slug -> design + palette. Cada agente tem seu desenho unico.
const ROBOTS: Record<string, { design: DesignFn; palette: number }> = {
  "cash-flow": { design: crab, palette: 0 },          // Croma: carangueijo Estrateg[IA]
  "context-linter": { design: robot1eye, palette: 7 }, // Vetor: amarelo, 1 olho
  "founder-coach": { design: tallSmile, palette: 3 },  // Nimbus: azul, sorriso largo
  icp: { design: robot2eye, palette: 4 },              // Pulso: verde, 2 olhos
  "market-map": { design: market, palette: 5 },         // Atlas: roxo, bussola
  "offer-strategist": { design: valuedrop, palette: 2 }, // Quark: magenta, cifrão
  "problem-magnet": { design: octopus, palette: 1 },    // Imã: ciano, polvos
  "seed-assistant": { design: seed, palette: 7 },       // Semente: amarelo, gota
  summarizer: { design: ecorobot, palette: 6 },         // Eco: branco, sensor
  "validation-synth": { design: nexus, palette: 2 },     // Bit: magenta, losango
  "value-thesis": { design: alien3eye, palette: 0 },    // Nexo: laranja Estrateg[IA], 3 olhos
};

/** Fallback para slugs nao mapeados: rotaciona designs/paletas via hash. */
function fallbackFor(slug: string): { design: DesignFn; palette: number } {
  let h = 5381;
  for (let i = 0; i < slug.length; i++) h = ((h << 5) + h + slug.charCodeAt(i)) >>> 0;
  const designs: DesignFn[] = [crab, robot1eye, alien3eye, robot2eye, octopus, tallSmile, seed, valuedrop, ecorobot, nexus, market];
  return { design: designs[h % designs.length], palette: h % PALETTES.length };
}

export interface RobotAvatarProps {
  slug: string;
  /** Tamanho em px (largura = altura). Default 64. */
  size?: number;
  className?: string;
}

export function RobotAvatar({
  slug,
  size = 64,
  className,
}: RobotAvatarProps): React.JSX.Element {
  const { design, palette } = ROBOTS[slug] ?? fallbackFor(slug);
  const { body, accent, face } = PALETTES[palette];

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      width={size}
      height={size}
      role="img"
      aria-hidden
      shapeRendering="crispEdges"
      className={cn("shrink-0", className)}
    >
      {/* Fundo transparente — cada pixel e desenhado explicitamente */}
      {design(body, accent, face)}
    </svg>
  );
}
