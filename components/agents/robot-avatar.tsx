import type * as React from "react";

import { agentSeed } from "@/lib/agents/persona";
import { cn } from "@/lib/utils";

/**
 * Avatar pixel-art Estrateg[IA] — robos/alienigenas em 8-bit.
 * Estilo identico ao mascot `.scia-clawd` do site original (carangueijo
 * pixelado laranja com olhos pixel). Determinístico: mesmo slug -> mesmo robo.
 * Cada variacao (forma do corpo, bracos, olhos, pernas) vem de canais
 * independentes do hash, garantindo rosto unico por agente.
 *
 * SVG inline rasterizado com `shape-rendering: crispEdges` para manter o
 * pixel perfeito em qualquer escala.
 */

interface Palette {
  bg: string;       // fundo do quadrado
  body: string;     // corpo + olhos + boca (cor principal)
  accent: string;   // detalhes (pernas, bracos, anttenas)
  face: string;     // cor do fundo dos olhos (para contraste)
}

// Paleta Estrateg[IA] + variacoes. Laranja Estrateg[IA] e o padrao, com
// variacoes em ciano, magenta e branco-gelo para diferenciar agentes.
const PALETTES: Palette[] = [
  // laranja Estrateg[IA] (default — combinacao com o site)
  { bg: "#0B0A09", body: "#E97858", accent: "#E63B16", face: "#F2F0EC" },
  // ciano
  { bg: "#0B0A09", body: "#5DD4D4", accent: "#0E8577", face: "#F2F0EC" },
  // magenta
  { bg: "#0B0A09", body: "#F07AA6", accent: "#C42A6B", face: "#F2F0EC" },
  // azul
  { bg: "#0B0A09", body: "#69A8F0", accent: "#1E6FCC", face: "#F2F0EC" },
  // verde
  { bg: "#0B0A09", body: "#77C888", accent: "#2E8B45", face: "#F2F0EC" },
  // roxo
  { bg: "#0B0A09", body: "#B87AE0", accent: "#7E33B0", face: "#F2F0EC" },
  // branco
  { bg: "#0B0A09", body: "#F2F0EC", accent: "#9A938B", face: "#0B0A09" },
  // amarelo
  { bg: "#0B0A09", body: "#F6C73C", accent: "#D9691A", face: "#F2F0EC" },
];

const SIZE = 64; // tamanho logico do SVG
const PX = 4;     // tamanho de cada "pixel" no grid 16x16

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

/** Desenha um robo alien no grid 16x16 com 4 variacoes. */
function drawAlien(
  body: string,
  accent: string,
  face: string,
  variant: number,
): React.JSX.Element[] {
  const out: React.JSX.Element[] = [];

  // Corpo (linhas 5-10): sempre 8 colunas centradas (cols 4-11)
  // olhos sempre nas linhas 6-7
  for (let y = 5; y <= 10; y++) {
    for (let x = 4; x <= 11; x++) {
      out.push(px(x, y, body));
    }
  }

  // Pinças (esquerda col 2-3, direita col 12-13) — linhas 6-7
  out.push(px(2, 6, accent));
  out.push(px(3, 6, accent));
  out.push(px(12, 6, accent));
  out.push(px(13, 6, accent));
  out.push(px(2, 7, accent));
  out.push(px(3, 7, accent));
  out.push(px(12, 7, accent));
  out.push(px(13, 7, accent));

  // Olhos — duas variacoes
  if (variant % 2 === 0) {
    // olhos pixel pequenos (cols 6-7, linha 6)
    out.push(px(6, 6, face));
    out.push(px(9, 6, face));
  } else {
    // olhos pixel grandes (cols 5-7 e 8-10, linhas 6-7)
    out.push(px(5, 6, face));
    out.push(px(6, 6, face));
    out.push(px(7, 6, face));
    out.push(px(8, 6, face));
    out.push(px(9, 6, face));
    out.push(px(10, 6, face));
    out.push(px(5, 7, face));
    out.push(px(6, 7, face));
    out.push(px(7, 7, face));
    out.push(px(8, 7, face));
    out.push(px(9, 7, face));
    out.push(px(10, 7, face));
  }

  // Boca (linha 8) — uma linha horizontal
  for (let x = 5; x <= 10; x++) {
    out.push(px(x, 8, face));
  }
  // se variante "zangado", boca com "dentes" (alguns pixels invertidos)
  if (variant === 2) {
    out.push(px(6, 8, body));
    out.push(px(8, 8, body));
    out.push(px(10, 8, body));
  }

  // Pernas (linhas 11-13): 4 perninhas
  // variante 0: retas
  // variante 1: abertas
  // variante 2: zig-zag
  // variante 3: cruz
  if (variant === 0) {
    out.push(px(5, 11, accent));
    out.push(px(5, 12, accent));
    out.push(px(7, 11, accent));
    out.push(px(7, 12, accent));
    out.push(px(8, 11, accent));
    out.push(px(8, 12, accent));
    out.push(px(10, 11, accent));
    out.push(px(10, 12, accent));
  } else if (variant === 1) {
    out.push(px(4, 11, accent));
    out.push(px(5, 12, accent));
    out.push(px(7, 11, accent));
    out.push(px(6, 12, accent));
    out.push(px(9, 11, accent));
    out.push(px(10, 12, accent));
    out.push(px(11, 11, accent));
  } else if (variant === 2) {
    out.push(px(5, 11, accent));
    out.push(px(6, 12, accent));
    out.push(px(7, 13, accent));
    out.push(px(8, 11, accent));
    out.push(px(9, 12, accent));
    out.push(px(10, 13, accent));
  } else {
    out.push(px(5, 11, accent));
    out.push(px(5, 13, accent));
    out.push(px(7, 11, accent));
    out.push(px(7, 13, accent));
    out.push(px(8, 11, accent));
    out.push(px(8, 13, accent));
    out.push(px(10, 11, accent));
    out.push(px(10, 13, accent));
  }

  return out;
}

export interface RobotAvatarProps {
  slug: string;
  /** Tamanho em px (largura = altura). Default 44. */
  size?: number;
  className?: string;
}

export function RobotAvatar({
  slug,
  size = 44,
  className,
}: RobotAvatarProps): React.JSX.Element {
  const seed = agentSeed(slug);
  const palette = PALETTES[seed % PALETTES.length];
  const variant = (seed >>> 8) % 4;
  const { bg, body, accent, face } = palette;

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
      {/* Fundo */}
      <rect x="0" y="0" width={SIZE} height={SIZE} fill={bg} />
      {drawAlien(body, accent, face, variant)}
    </svg>
  );
}
