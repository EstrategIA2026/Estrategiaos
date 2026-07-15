"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import {
  updateEmail,
  updateName,
  updatePassword,
} from "@/app/conta/actions";
import type { ContaState } from "@/app/conta/types";

/** Formulario de nome completo. */
export function NameForm({
  initialName,
}: {
  initialName: string;
}) {
  const [state, formAction, pending] = useActionState<ContaState, FormData>(
    updateName,
    undefined,
  );
  return (
    <FormSection titulo="Nome">
      <form action={formAction} className="space-y-3">
        <Input
          name="full_name"
          defaultValue={initialName}
          placeholder="Seu nome completo"
          maxLength={120}
          disabled={pending}
        />
        <Actions
          submitLabel="Salvar nome"
          state={state}
          pending={pending}
        />
      </form>
    </FormSection>
  );
}

/** Formulario de troca de e-mail. */
export function EmailForm({ email }: { email: string }) {
  const [state, formAction, pending] = useActionState<ContaState, FormData>(
    updateEmail,
    undefined,
  );
  return (
    <FormSection titulo="E-mail" subtitulo={`Atual: ${email}`}>
      <form action={formAction} className="space-y-3">
        <Input
          name="email"
          type="email"
          defaultValue={email}
          placeholder="novo@exemplo.com"
          required
          disabled={pending}
        />
        <p className="font-mono text-[11px] tracking-wider text-muted-foreground">
          Voce recebera um link de confirmacao no novo e-mail.
        </p>
        <Actions
          submitLabel="Trocar e-mail"
          state={state}
          pending={pending}
        />
      </form>
    </FormSection>
  );
}

/** Formulario de troca de senha. */
export function PasswordForm() {
  const [state, formAction, pending] = useActionState<ContaState, FormData>(
    updatePassword,
    undefined,
  );
  return (
    <FormSection titulo="Senha" subtitulo="Minimo 6 caracteres.">
      <form action={formAction} className="space-y-3">
        <PasswordInput
          name="password"
          placeholder="Nova senha"
          minLength={6}
          required
          disabled={pending}
        />
        <PasswordInput
          name="password_confirm"
          placeholder="Confirmar nova senha"
          minLength={6}
          required
          disabled={pending}
        />
        <Actions
          submitLabel="Trocar senha"
          state={state}
          pending={pending}
        />
      </form>
    </FormSection>
  );
}

function FormSection({
  titulo,
  subtitulo,
  children,
}: {
  titulo: string;
  subtitulo?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-md border bg-card p-6 scia-card">
      <h2 className="mb-1 font-display text-lg font-extrabold">{titulo}</h2>
      {subtitulo && (
        <p className="mb-4 font-mono text-[11px] tracking-wider text-muted-foreground">
          {subtitulo}
        </p>
      )}
      {!subtitulo && <div className="mb-4" />}
      {children}
    </div>
  );
}

function Actions({
  submitLabel,
  state,
  pending,
}: {
  submitLabel: string;
  state: ContaState;
  pending: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : submitLabel}
      </Button>
      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-sm text-brand">{state.success}</p>
      )}
    </div>
  );
}
