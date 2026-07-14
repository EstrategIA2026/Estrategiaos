import { Funnel_Display, JetBrains_Mono, Poppins } from "next/font/google";

/**
 * Tipografia do BusinessOS — Estrateg[IA] visual:
 *   - Funnel Display: sans pesada e geometrica (titulos, marca, H1)
 *   - Poppins: sans humanista (texto do corpo, paragrafos)
 *   - JetBrains Mono: mono com ascendencia de hacker (tags, labels, "code feel")
 *
 * O `next/font/google` baixa as fontes em build e expoe as CSS vars
 * `--font-funnel-display` / `--font-poppins` / `--font-jetbrains-mono`.
 * Em `app/layout.tsx` aplicamos as `.variable` no `<html>`; em
 * `globals.css` mapeamos `--font-sans`/`--font-mono` para elas, de modo
 * que o resto do sistema (Tailwind `font-sans`/`font-mono`) continua
 * referenciando `--font-sans` sem saber qual e a familia concreta.
 */
export const fontFunnel = Funnel_Display({
  subsets: ["latin"],
  variable: "--font-funnel-display",
  display: "swap",
  weight: ["400", "500", "700", "800"],
});

export const fontPoppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

/** Classes a aplicar no `<html>` — publica as tres CSS vars. */
export const fontVariables = `${fontFunnel.variable} ${fontPoppins.variable} ${fontMono.variable}`;
