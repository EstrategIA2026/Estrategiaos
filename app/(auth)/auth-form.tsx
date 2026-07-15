"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { resetPassword, signIn, signUp, type AuthState } from "./actions";

interface AuthFormProps {
  /** Titulo grande do card (ex.: "Entrar"). */
  title: string;
  /** Subtitulo curto abaixo do titulo. */
  subtitle: string;
  /** Server Action (signIn | signUp). */
  action: typeof signIn | typeof signUp;
  /** Rotulo do botao primario (ex.: "Entrar"). */
  submitLabel: string;
  /** Texto do rodape (ex.: "Não tem conta?"). */
  footerText: string;
  /** Rota do link do rodape. */
  footerHref: string;
  /** Rotulo do link do rodape. */
  footerLinkLabel: string;
  /** `true` no signup: mostra dica de senha e autocomplete apropriado. */
  isSignup?: boolean;
  /** `true` no signin: mostra link "Esqueceu a senha?". */
  showForgotPassword?: boolean;
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Aguarde…" : label}
    </Button>
  );
}

/**
 * Form de autenticacao (login/signup) — client component. Usa `useActionState`
 * para exibir erros/infos inline em pt-BR sem sair da pagina. Visual coerente
 * com o design "Flux": card branco arredondado, inputs pill.
 *
 * No modo signin, oferece um inline form "Esqueceu a senha?" que alterna o
 * card sem trocar de rota.
 */
export function AuthForm({
  title,
  subtitle,
  action,
  submitLabel,
  footerText,
  footerHref,
  footerLinkLabel,
  isSignup = false,
  showForgotPassword = false,
}: AuthFormProps) {
  const [state, formAction] = useActionState<AuthState, FormData>(action, {});

  if (showForgotPassword) {
    return <LoginFormWithForgot />;
  }

  return (
    <div className="flex flex-col gap-6 rounded-md bg-card p-8 shadow-sm">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="voce@empresa.com"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Senha</Label>
          <PasswordInput
            id="password"
            name="password"
            autoComplete={isSignup ? "new-password" : "current-password"}
            required
            minLength={isSignup ? 6 : undefined}
            placeholder="••••••••"
          />
          {isSignup && (
            <p className="text-xs text-muted-foreground">
              Ao menos 6 caracteres.
            </p>
          )}
        </div>

        {state.error && (
          <p
            role="alert"
            className="rounded-md bg-destructive/10 px-4 py-2.5 text-sm text-destructive"
          >
            {state.error}
          </p>
        )}
        {state.info && (
          <p
            role="status"
            className="rounded-md bg-brand-muted px-4 py-2.5 text-sm text-foreground"
          >
            {state.info}
          </p>
        )}

        <SubmitButton label={submitLabel} />
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {footerText}{" "}
        <Link
          href={footerHref}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          {footerLinkLabel}
        </Link>
      </p>
    </div>
  );
}

/** Login que alterna para o modo "esqueceu a senha?" sem trocar de rota. */
function LoginFormWithForgot() {
  const [mode, setMode] = useState<"login" | "forgot">("login");

  return (
    <div className="flex flex-col gap-6 rounded-md bg-card p-8 shadow-sm">
      {mode === "login" ? (
        <LoginForm onForgotClick={() => setMode("forgot")} />
      ) : (
        <ForgotForm onBackClick={() => setMode("login")} />
      )}
    </div>
  );
}

function LoginForm({ onForgotClick }: { onForgotClick: () => void }) {
  const [state, formAction] = useActionState<AuthState, FormData>(signIn, {});
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold tracking-tight">Entrar</h1>
        <p className="text-sm text-muted-foreground">Acesse o seu OS de decisão.</p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="voce@empresa.com"
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Senha</Label>
            <button
              type="button"
              onClick={onForgotClick}
              className="text-xs font-medium text-brand underline-offset-4 hover:underline"
            >
              Esqueceu a senha?
            </button>
          </div>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
          />
        </div>

        {state.error && (
          <p
            role="alert"
            className="rounded-md bg-destructive/10 px-4 py-2.5 text-sm text-destructive"
          >
            {state.error}
          </p>
        )}
        {state.info && (
          <p
            role="status"
            className="rounded-md bg-brand-muted px-4 py-2.5 text-sm text-foreground"
          >
            {state.info}
          </p>
        )}

        <SubmitButton label="Entrar" />
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Não tem conta?{" "}
        <Link
          href="/signup"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Criar conta
        </Link>
      </p>
    </>
  );
}

function ForgotForm({ onBackClick }: { onBackClick: () => void }) {
  const [state, formAction] = useActionState<AuthState, FormData>(
    resetPassword,
    {},
  );
  // Injeta o origin atual no FormData via ref do form para que o redirectTo do
  // Supabase aponte para o host correto (prod ou preview da Vercel).
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (formRef.current && !formRef.current.dataset.originInjected) {
      const origin = window.location.origin;
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = "_origin";
      input.value = origin;
      formRef.current.appendChild(input);
      formRef.current.dataset.originInjected = "1";
    }
  }, []);

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold tracking-tight">Recuperar senha</h1>
        <p className="text-sm text-muted-foreground">
          Informe seu e-mail e enviaremos um link para redefinir a senha.
        </p>
      </div>

      <form ref={formRef} action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="voce@empresa.com"
          />
        </div>

        {state.error && (
          <p
            role="alert"
            className="rounded-md bg-destructive/10 px-4 py-2.5 text-sm text-destructive"
          >
            {state.error}
          </p>
        )}
        {state.info && (
          <p
            role="status"
            className="rounded-md bg-brand-muted px-4 py-2.5 text-sm text-foreground"
          >
            {state.info}
          </p>
        )}

        <SubmitButton label="Enviar link de recuperacao" />
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Lembrou?{" "}
        <button
          type="button"
          onClick={onBackClick}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Voltar para o login
        </button>
      </p>
    </>
  );
}
