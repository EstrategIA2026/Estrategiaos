import Image from "next/image";
import { Compass, Cpu, Layers, MapPin, Sparkles, Timer } from "lucide-react";

import { Topbar } from "@/components/layout/topbar";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { SciaTitle } from "@/components/ui/scia-title";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Pagina /sobre — documento do Estrateg[IA].
 *
 * Conteudo reescrito para falar do Estrateg[IA] (modelo de negocio + metodo +
 * comunidade), nao do software onde ele mora. O BusinessOS e apenas o
 * sistema operacional que carrega o Estrateg[IA] como metodo.
 */
export default function SobrePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Topbar>
        <Breadcrumb items={[{ label: "Sobre", href: "/sobre" }]} />
      </Topbar>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12 md:py-16">
        <Hero />
        <Origem />
        <Manifesto />
        <Arquitetura />
        <Caminho />
        <Mantenedora />
        <Rodape />
      </main>
    </div>
  );
}

function Hero() {
  return (
    <header className="mb-16 rounded-2xl border bg-card p-8 md:p-12">
      <p className="scia-tag mb-4">[ O QUE E ]</p>
      <SciaTitle as="h1">
        Estrateg<span className="text-brand">[IA]</span>
      </SciaTitle>
      <p className="mt-5 max-w-2xl text-lg text-muted-foreground md:text-xl">
        Modelo de negocio para coordenadores de nucleo em hospitais
        brasileiros. Consultoria + agentes de IA com responsabilidade tecnica.
      </p>
      <p className="mt-3 max-w-2xl text-base text-muted-foreground">
        Estrateg[IA] e o que tira do papel o operacional que consome 4-8
        horas por entrega — POPs, treinamentos, relatorios, planos de acao,
        analise de evento — e devolve tempo, sanidade e autoridade tecnica
        ao coordenador.
      </p>
    </header>
  );
}

function Origem() {
  return (
    <Section titulo="A origem" tag="[ 01 ]">
      <p>
        Estrateg[IA] comecou como um canal de aulas sobre IA aplicada a
        estrategia. O canal ensinava o basico para coordenadores de
        Enfermagem, NEP, CCIH, Qualidade e Seguranca do Paciente usarem
        agentes de IA no dia a dia.
      </p>
      <p>
        A audiencia pediu mais. Pediu para a gente montar. Pediu frameworks
        prontos. Pediu ferramentas que funcionassem sem o coordenador virar
        especialista em prompt. Estrateg[IA] virou entao tres coisas juntas: a
        marca, o metodo (framework de solucao) e a comunidade de coordenadores
        que usam.
      </p>
      <p>
        O cluster sao coordenadores de nucleo em hospitais privados,
        filantropicos ou publicos de 80-500 leitos, no Sudeste brasileiro, em
        ciclo de acreditacao ONA/Qmentum. E para esse perfil que Estrateg[IA]
        e construido.
      </p>
    </Section>
  );
}

function Manifesto() {
  const itens = [
    {
      n: "01",
      titulo: "Tempo de volta",
      texto:
        "Trabalho MEIO (entre o dado e a decisao) que engole 4-8h vira entregaveis de 30-60 min com revisao humana.",
    },
    {
      n: "02",
      titulo: "Clareza estrategica",
      texto:
        "Frameworks que tiram a decisao do achismo. POP, treinamento, relatorio e plano de acao entram em formato institucional, com LGPD.",
    },
    {
      n: "03",
      titulo: "Responsabilidade tecnica",
      texto:
        "ONA 2026 e CFM 2026 ja tornaram IA com processo criterio formal de acreditacao. Estrateg[IA] e o processo.",
    },
  ];
  return (
    <Section titulo="O que entrega" tag="[ 02 ]">
      <p>
        Estrateg[IA] opera em tres camadas que se reforcam: o canal gratuito
        para ensinar o basico, os agentes prontos para usar no dia a dia, e a
        consultoria sob medida para implementar.
      </p>
      <div className="mt-6 grid gap-px overflow-hidden rounded-md border bg-border">
        {itens.map((item) => (
          <div
            key={item.n}
            className="flex flex-col gap-2 bg-card p-6 md:flex-row md:items-start md:gap-6"
          >
            <span className="scia-tag shrink-0">[ {item.n} ]</span>
            <div>
              <h3 className="mb-1 text-lg font-bold md:text-xl">{item.titulo}</h3>
              <p className="text-sm text-muted-foreground md:text-base">
                {item.texto}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function Arquitetura() {
  return (
    <Section titulo="Como funciona por dentro" tag="[ 03 ]">
      <p>
        Estrateg[IA] usa IA generativa (Claude) como motor e um BusinessOS
        interno como ferramenta operacional — onde os 11 cards do cluster sao
        preenchidos pela founder para destravar a oferta, validar o problema e
        rodar a operacao.
      </p>
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <Cartao
          icon={Layers}
          titulo="Metodo Estrateg[IA]"
          texto="Framework de solucao: diagnostico digital (ate 5 gratis) -> plano 30/60/90 -> implantacao com KPI. Sem improviso."
        />
        <Cartao
          icon={Sparkles}
          titulo="Agentes prontos"
          texto="Skills e sub-agentes de Claude que rodam no terminal (pnpm agent:read / agent:write) e produzem POP, treinamento, relatorio, analise de evento."
        />
        <Cartao
          icon={Cpu}
          titulo="RAG"
          texto="Embeddings dos cards e das conversas viram base de conhecimento. O chat lembra do que foi decidido antes."
        />
        <Cartao
          icon={MapPin}
          titulo="Cluster ancorado"
          texto="Coordenadores de Enfermagem, NEP, CCIH, NSP e Qualidade em hospitais 80-500 leitos do Sudeste, em ciclo ONA/Qmentum."
        />
      </div>
    </Section>
  );
}

function Cartao({
  icon: Icon,
  titulo,
  texto,
}: {
  icon: React.ComponentType<{ className?: string }>;
  titulo: string;
  texto: string;
}) {
  return (
    <div className="rounded-md border bg-card p-5 scia-card">
      <Icon className="mb-3 size-5 text-brand" aria-hidden />
      <h3 className="mb-1 text-base font-bold">{titulo}</h3>
      <p className="text-sm text-muted-foreground">{texto}</p>
    </div>
  );
}

function Caminho() {
  const estagios = [
    {
      titulo: "Onboarding",
      texto:
        "Primeiro acesso: o BusinessOS pede os dados da founder e semeia as 11 entidades vazias.",
    },
    {
      titulo: "Direcao",
      texto:
        "Tese de valor, perfil ideal, mapa do mercado, ima de problemas. Formular o que o negocio e e para quem.",
    },
    {
      titulo: "Validacao",
      texto:
        "Oferta, experimentos, primeiros clientes. Evidencia antes da oferta virar 'pronta'.",
    },
    {
      titulo: "Operacao",
      texto:
        "Caixa, leads, oportunidades, workflow. Estrateg[IA] vira o painel do dia a dia, e a IA entra como assistente.",
    },
  ];
  return (
    <Section titulo="Por onde a founder passa" tag="[ 04 ]">
      <p>
        Estrateg[IA] modela quatro fases. Nao sao lineares — uma founder
        volta a Direcao depois de validar, ou volta a Validacao depois de
        rodar a Operacao. Mas a ordem de primeira passagem costuma ser:
      </p>
      <ol className="mt-6 space-y-3">
        {estagios.map((e, i) => (
          <li
            key={e.titulo}
            className="flex gap-4 rounded-md border bg-card p-5"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand/10 font-mono text-sm font-bold text-brand">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <h3 className="mb-1 text-base font-bold">{e.titulo}</h3>
              <p className="text-sm text-muted-foreground">{e.texto}</p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}

function Mantenedora() {
  return (
    <Section titulo="Quem mantem" tag="[ 05 ]">
      <div className="grid gap-6 md:grid-cols-[180px_1fr]">
        <div className="relative aspect-square overflow-hidden rounded-md border bg-card scia-card">
          <Image
            src="/sobre/rosa-card.png"
            alt="Rosa Kethllyn, fundadora do Estrateg[IA]"
            fill
            sizes="(min-width: 768px) 180px, 100vw"
            className="object-cover"
          />
        </div>
        <div>
          <p className="scia-tag mb-2">[ MENTORA ]</p>
          <h3 className="mb-3 text-2xl font-extrabold tracking-tight">
            Rosa Kethllyn
          </h3>
          <p className="mb-3 text-base text-muted-foreground md:text-lg">
            Enfermeira com 10 anos em nucleo de Qualidade/NEP. Hoje constroi
            ferramentas de IA para coordenadores como ela.
          </p>
          <p className="text-base text-muted-foreground md:text-lg">
            Estrateg[IA] nasceu do operacional que ela mesma viveu: 4-8h para
            fechar um POP, um treinamento, uma analise de evento. A IA que
            ela precisou e a IA que ela entrega.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Badge label="Canal" sub="ensino · gratis" icon={Sparkles} />
            <Badge label="Agentes" sub="produto · self-serve" icon={Compass} />
            <Badge label="Consultoria" sub="sob medida" icon={Timer} />
          </div>
        </div>
      </div>
    </Section>
  );
}

function Badge({
  label,
  sub,
  icon: Icon,
}: {
  label: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-md border px-4 py-2.5">
      <div className="flex items-center gap-2 text-base font-extrabold text-brand">
        <Icon className="size-4" aria-hidden />
        {label}
      </div>
      <div className="font-mono text-[10px] tracking-wider text-muted-foreground">
        {sub}
      </div>
    </div>
  );
}

function Rodape() {
  return (
    <footer className="mt-16 border-t pt-8 text-sm text-muted-foreground">
      <p>
        Documento aberto, versao 1. Atualizado quando a arquitetura muda.
        Ultima revisao: 13 de julho de 2026.
      </p>
    </footer>
  );
}

function Section({
  tag,
  titulo,
  children,
}: {
  tag: string;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-14">
      <p className="scia-tag mb-2">{tag}</p>
      <h2 className="mb-6 font-display text-2xl font-bold tracking-tight md:text-3xl">
        {titulo}
      </h2>
      <div className="space-y-4 text-base leading-relaxed text-foreground/90">
        {children}
      </div>
    </section>
  );
}
