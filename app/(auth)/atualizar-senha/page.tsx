"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { createClient } from "@/lib/supabase/client";

/**
 * Pagina `/atualizar-senha` — destino do magic link de recuperacao.
 *
 * O Supabase adiciona o access token na URL quando o usuario clica no link do
 * e-mail. Detectamos a sessao e oferecemos um form para definir a nova senha.
 * Em caso de sessao ausente (link expirado, invalido), orientamos a pedir
 * um novo link.
 */
export default function UpdatePasswordPage() {
  const router = useRouter();
  const [state, setState] = useState<
    | { phase: "loading" }
    | { phase: "ready" }
    | { phase: "missing" }
  >({ phase: "loading" });
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session) {
        setState({ phase: "ready" });
      } else {
        setState({ phase: "missing" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (password.length < 6) {
      setError("A senha precisa ter ao menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas nao coincidem.");
      return;
    }
    setPending(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password });
    setPending(false);
    if (err) {
      setError(err.message);
      return;
    }
    setInfo("Senha atualizada. Entrando...");
    setTimeout(() => router.push("/founder"), 800);
  }

  return (
    <div className="flex flex-col gap-6 rounded-md bg-card p-8 shadow-sm">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold tracking-tight">Definir nova senha</h1>
        <p className="text-sm text-muted-foreground">
          Escolha uma senha nova para a sua conta.
        </p>
      </div>

      {state.phase === "loading" && (
        <p className="text-sm text-muted-foreground">Validando link...</p>
      )}

      {state.phase === "missing" && (
        <div className="flex flex-col gap-3">
          <p
            role="alert"
            className="rounded-md bg-destructive/10 px-4 py-2.5 text-sm text-destructive"
          >
            Link expirado ou invalido. Volte e peca um novo link de recuperacao.
          </p>
          <a
            href="/login"
            className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
          >
            Voltar para o login
          </a>
        </div>
      )}

      {state.phase === "ready" && (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Nova senha</Label>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="new-password"
              required
              minLength={6}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password_confirm">Confirmar nova senha</Label>
            <PasswordInput
              id="password_confirm"
              name="password_confirm"
              autoComplete="new-password"
              required
              minLength={6}
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Ao menos 6 caracteres.</p>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-md bg-destructive/10 px-4 py-2.5 text-sm text-destructive"
            >
              {error}
            </p>
          )}
          {info && (
            <p
              role="status"
              className="rounded-md bg-brand-muted px-4 py-2.5 text-sm text-foreground"
            >
              {info}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Salvando..." : "Salvar nova senha"}
          </Button>
        </form>
      )}
    </div>
  );
}
