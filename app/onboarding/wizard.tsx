"use client";

import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useMemo, useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { completeOnboarding, type OnboardingData } from "./actions";

/**
 * Wizard de onboarding — uma pergunta por vez, ocupando toda a tela. P&B, no
 * design "Flux". Avanca com Enter ou pelo botao; a ultima pergunta (tamanho do
 * time) e por escolha e conclui o fluxo, gravando o perfil via Server Action.
 */

type FieldKey = keyof OnboardingData;

interface StepText {
  kind: "text";
  field: FieldKey;
  question: string;
  subtitle: string;
  placeholder: string;
  inputType: "text" | "email" | "tel";
  autoComplete: string;
  inputMode?: "text" | "email" | "tel";
}

interface StepChoice {
  kind: "choice";
  field: FieldKey;
  question: string;
  subtitle: string;
  options: string[];
}

type Step = StepText | StepChoice;

const STEPS: Step[] = [
  {
    kind: "text",
    field: "fullName",
    question: "Qual é o seu nome?",
    subtitle: "Como você gostaria de ser chamado.",
    placeholder: "Seu nome completo",
    inputType: "text",
    autoComplete: "name",
  },
  {
    kind: "text",
    field: "email",
    question: "Qual é o seu e-mail?",
    subtitle: "É por onde falamos com você.",
    placeholder: "voce@empresa.com",
    inputType: "email",
    autoComplete: "email",
    inputMode: "email",
  },
  {
    kind: "text",
    field: "whatsapp",
    question: "Qual é o seu WhatsApp?",
    subtitle: "Com DDD — só para contato direto.",
    placeholder: "(11) 90000-0000",
    inputType: "tel",
    autoComplete: "tel",
    inputMode: "tel",
  },
  {
    kind: "text",
    field: "companyName",
    question: "Qual o nome da sua empresa?",
    subtitle: "O negócio que você toca hoje.",
    placeholder: "Nome da empresa",
    inputType: "text",
    autoComplete: "organization",
  },
  {
    kind: "choice",
    field: "employeeCount",
    question: "Quantos funcionários tem na sua empresa?",
    subtitle: "Uma faixa aproximada já basta.",
    options: ["Só eu", "2–5", "6–10", "11–50", "51–200", "200+"],
  },
];

/** Validacao minima por campo. Retorna mensagem de erro ou null (ok). */
function validate(field: FieldKey, value: string): string | null {
  const v = value.trim();
  switch (field) {
    case "fullName":
      return v.length >= 2 ? null : "Digite o seu nome.";
    case "email":
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
        ? null
        : "Digite um e-mail válido.";
    case "whatsapp":
      return v.replace(/\D/g, "").length >= 10
        ? null
        : "Digite um WhatsApp válido, com DDD.";
    case "companyName":
      return v.length >= 1 ? null : "Digite o nome da empresa.";
    case "employeeCount":
      return v.length >= 1 ? null : "Escolha uma faixa.";
    default:
      return null;
  }
}

export function OnboardingWizard({
  defaultName,
  defaultEmail,
}: {
  defaultName: string;
  defaultEmail: string;
}) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<OnboardingData>({
    fullName: defaultName,
    email: defaultEmail,
    whatsapp: "",
    companyName: "",
    employeeCount: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const step = STEPS[index];
  const isLast = index === STEPS.length - 1;
  const progress = useMemo(
    () => ((index + 1) / STEPS.length) * 100,
    [index],
  );
  const value = answers[step.field];

  function setValue(v: string) {
    setError(null);
    setAnswers((prev) => ({ ...prev, [step.field]: v }));
  }

  function submit(data: OnboardingData) {
    setError(null);
    startTransition(async () => {
      const res = await completeOnboarding(data);
      // Em caso de sucesso o Server Action redireciona (nao retorna aqui).
      if (res?.error) setError(res.error);
    });
  }

  /** Avanca (ou conclui) validando a resposta atual. */
  function advance(nextValue?: string) {
    const current = nextValue ?? value;
    const err = validate(step.field, current);
    if (err) {
      setError(err);
      return;
    }
    const nextAnswers =
      nextValue !== undefined
        ? { ...answers, [step.field]: nextValue }
        : answers;
    if (nextValue !== undefined) setAnswers(nextAnswers);

    if (isLast) {
      submit(nextAnswers);
      return;
    }
    setError(null);
    setIndex((i) => Math.min(i + 1, STEPS.length - 1));
    // Foco no proximo input acontece via `key`/autoFocus abaixo.
  }

  function back() {
    if (index === 0 || pending) return;
    setError(null);
    setIndex((i) => Math.max(i - 1, 0));
  }

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Barra de progresso fina no topo. */}
      <div className="h-1 w-full bg-muted">
        <div
          className="h-full bg-primary transition-[width] duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div
          // `key` reinicia a animacao e o autoFocus a cada pergunta.
          key={index}
          className="flex w-full max-w-xl flex-col gap-8 duration-300 animate-in fade-in slide-in-from-bottom-3"
        >
          <div className="flex flex-col gap-3">
            <span className="text-sm font-medium text-muted-foreground">
              {String(index + 1).padStart(2, "0")} / {String(STEPS.length).padStart(2, "0")}
            </span>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {step.question}
            </h1>
            <p className="text-base text-muted-foreground">{step.subtitle}</p>
          </div>

          {step.kind === "text" ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                advance();
              }}
              className="flex flex-col gap-6"
            >
              <Input
                ref={inputRef}
                autoFocus
                type={step.inputType}
                inputMode={step.inputMode}
                autoComplete={step.autoComplete}
                placeholder={step.placeholder}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="h-14 rounded-md px-5 text-lg"
                aria-invalid={Boolean(error)}
              />

              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}

              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={back}
                  disabled={index === 0 || pending}
                  className={cn(index === 0 && "invisible")}
                >
                  <ArrowLeft /> Voltar
                </Button>
                <Button type="submit" size="lg" disabled={pending}>
                  Continuar <ArrowRight />
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {step.options.map((opt) => {
                  const selected = value === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      disabled={pending}
                      onClick={() => setValue(opt)}
                      className={cn(
                        "flex h-16 items-center justify-center gap-2 rounded-md border px-4 text-base font-medium transition-colors disabled:opacity-50",
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input bg-card hover:bg-accent hover:text-accent-foreground",
                      )}
                    >
                      {selected && <Check className="size-4" />}
                      {opt}
                    </button>
                  );
                })}
              </div>

              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}

              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={back}
                  disabled={pending}
                >
                  <ArrowLeft /> Voltar
                </Button>
                <Button
                  type="button"
                  size="lg"
                  onClick={() => advance()}
                  disabled={pending || !value}
                >
                  {pending ? "Salvando…" : "Concluir"}
                  {!pending && <Check />}
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
