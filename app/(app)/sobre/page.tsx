import Image from "next/image";
import { Compass, Sparkles, Timer } from "lucide-react";

import { Topbar } from "@/components/layout/topbar";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { SciaTitle } from "@/components/ui/scia-title";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Pagina /sobre — Estrateg[IA] e quem mantem.
 *
 * Conteudo reescrito conforme briefing da Rosa: posiciona Estrateg[IA] como
 * modelo de negocio de educacao (canal gratuito no YouTube + agentes prontos
 * + consultoria sob medida) para coordenadores de nucleo hospitalar, com a
 * trajetoria da fundadora e a geografia corrigida para o Nordeste.
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
        <Caminho />
        <Mantenedora />
        <Rodape />
      </main>
    </div>
  );
}

function Hero() {
  return (
    <header className="mb-16 rounded-lg border bg-card p-8 md:p-12">
      <p className="scia-tag mb-4">[ O QUE E ]</p>
      <SciaTitle as="h1">
        Estrateg<span className="text-brand">[IA]</span>
      </SciaTitle>
      <p className="mt-5 max-w-2xl text-lg text-muted-foreground md:text-xl">
        Modelo de negocio de educacao em IA para coordenadores de nucleo em
        hospitais brasileiros.
      </p>
      <p className="mt-3 max-w-2xl text-base text-muted-foreground">
        O Estrateg[IA] e um negocio que comeca dando aulas de graca no
        YouTube. A partir do canal, ofereco agentes prontos para o
        coordenador usar no dia a dia e, se ele quiser, uma consultoria sob
        medida: avalio as necessidades dele e crio ou ensino a criar
        dependendo do pacote escolhido.
      </p>
    </header>
  );
}

function Origem() {
  return (
    <Section titulo="A origem" tag="[ 01 ]">
      <p>
        Estrateg[IA] esta surgindo agora. Comecei a estudar e entender
        Claude Code atraves dos videos do Juan Braz (Ruan Braz) no YouTube,
        e a partir dai fui aprendendo. Participei do programa Atlas e
        continuo aprendendo, implementando isso na minha vivencia
        hospitalar e na dos meus colegas aqui do hospital filantropico do
        interior do Ceara, no Nordeste brasileiro.
      </p>
      <p>
        O que era estudo virou comunidade e depois virou negocio. Hoje o
        Estrateg[IA] e tres coisas juntas: canal de aulas no YouTube (a
        entrada, gratis), agentes prontos para uso imediato, e
        consultoria sob medida para os coordenadores que quiserem ir
        alem.
      </p>
      <p>
        O cluster sao coordenadores de Enfermagem, NEP, CCIH, Qualidade e
        Seguranca do Paciente em hospitais do Nordeste brasileiro. E para
        esse perfil que Estrateg[IA] e construido.
      </p>
    </Section>
  );
}

function Manifesto() {
  const itens = [
    {
      n: "01",
      titulo: "Do zero ao avancado",
      texto:
        "Vou mostrar passo a passo como fazer ferramentas com IA, como usar os videos do YouTube. E algo mais basico que vai ate um pouco do avancado, mas nao e tao avancado que ninguem consegue aplicar.",
    },
    {
      n: "02",
      titulo: "Agentes prontos",
      texto:
        "Outra coisa que entrego sao agentes prontos para esses profissionais usarem no dia a dia. Eles implementam e usam direto, sem precisar virar especialista em prompt.",
    },
    {
      n: "03",
      titulo: "Consultoria sob medida",
      texto:
        "Se o profissional quiser, vendo uma consultoria onde avalio as necessidades dele e crio ou ensino a criar, dependendo de como ele escolher — o pacote muda conforme a escolha.",
    },
  ];
  return (
    <Section titulo="O que entrega" tag="[ 02 ]">
      <p>
        Estrateg[IA] opera em tres camadas que se reforcam: aulas gratis no
        YouTube para ensinar o basico, agentes prontos para usar no dia a
        dia, e consultoria sob medida para quem quer ir alem.
      </p>
      <div className="mt-6 grid gap-px overflow-hidden rounded-lg border bg-border">
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

function Caminho() {
  const estagios = [
    {
      titulo: "Onboarding",
      texto:
        "Primeiro acesso: o sistema pede os dados da founder e marca o inicio.",
    },
    {
      titulo: "Direcao",
      texto:
        "Tese de valor, perfil ideal, mapa do mercado, ima de problemas. Formular o que o negocio e e para quem.",
    },
    {
      titulo: "Validacao",
      texto:
        "Oferta, experimentos, primeiros clientes. Evidencia antes da oferta virar pronta.",
    },
    {
      titulo: "Operacao",
      texto:
        "Caixa, leads, oportunidades, workflow. Estrateg[IA] vira o painel do dia a dia, e a IA entra como assistente.",
    },
  ];
  return (
    <Section titulo="Por onde a founder passa" tag="[ 03 ]">
      <p>
        Estrateg[IA] modela quatro fases. Nao sao lineares — uma founder
        volta a Direcao depois de validar, ou volta a Validacao depois de
        rodar a Operacao. Mas a ordem de primeira passagem costuma ser:
      </p>
      <ol className="mt-6 space-y-3">
        {estagios.map((e, i) => (
          <li
            key={e.titulo}
            className="flex gap-4 rounded-lg border bg-card p-5"
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
    <Section titulo="Quem mantem" tag="[ 04 ]">
      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg border bg-card">
          <Image
            src="/sobre/rosa-card.png"
            alt="Rosa Kethllyn, fundadora do Estrateg[IA]"
            fill
            sizes="(min-width: 768px) 220px, 100vw"
            className="object-cover"
            priority
          />
        </div>
        <div>
          <p className="scia-tag mb-2">[ MENTORA ]</p>
          <h3 className="mb-3 text-2xl font-extrabold tracking-tight">
            Rosa Kethllyn
          </h3>
          <p className="mb-3 text-base text-muted-foreground md:text-lg">
            Enfermeira, professora, docente e especialista em marketing,
            gestao hospitalar e educacao no ensino superior.
          </p>
          <p className="mb-3 text-base text-muted-foreground md:text-lg">
            Atua em nucleo de Qualidade e NEP em hospital filantropico do
            interior do Ceara, no Nordeste brasileiro, com 2 anos e meio
            de experiencia na area.
          </p>
          <p className="text-base text-muted-foreground md:text-lg">
            Estrateg[IA] nasceu do operacional que ela mesma viveu: viu a IA
            deixar de ser coisa de video e virar ferramenta que faz
            diferenca no plantao, na auditoria, no POP, no treinamento.
            A IA que ela precisou e a IA que ela entrega.
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
        Ultima revisao: 14 de julho de 2026.
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
