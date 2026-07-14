"use client";

import { useActionState } from "react";
import { Loader2, Sparkles } from "lucide-react";

import { searchLeads, type LeadsSearchState } from "@/app/leads/actions";
import { Button } from "@/components/ui/button";

/**
 * Botao "Buscar leads com IA" — chama Tavily + Claude Fable 5 para gerar
 * novos leads a partir do card `direcao/perfil-ideal-de-cliente`.
 *
 * Client component: usa useActionState para feedback inline. Tem um Select
 * para a founder escolher a quantidade (5, 10 ou 20).
 */
export function LeadsSearchButton() {
  const [state, formAction, pending] = useActionState<
    LeadsSearchState,
    FormData
  >(searchLeads, undefined);

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-center gap-2"
    >
      <label
        htmlFor="lead-limit"
        className="font-mono text-[11px] tracking-wider text-muted-foreground"
      >
        QTD
      </label>
      <select
        id="lead-limit"
        name="limit"
        defaultValue="5"
        disabled={pending}
        className="rounded-md border border-input bg-muted px-2 py-1 text-xs font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="5">5</option>
        <option value="10">10</option>
        <option value="15">15</option>
        <option value="20">20</option>
      </select>
      <Button type="submit" variant="brand" size="sm" disabled={pending}>
        {pending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <Sparkles className="size-4" aria-hidden />
        )}
        {pending ? "Buscando..." : "Buscar leads com IA"}
      </Button>
      {state?.error && (
        <details className="basis-full text-xs text-destructive">
          <summary className="cursor-pointer font-medium">{state.error}</summary>
          {state.debug && (
            <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded-md border bg-muted p-3 text-[11px] text-foreground/80">
              {state.debug}
            </pre>
          )}
        </details>
      )}
      {state?.success && (
        <p className="basis-full text-xs text-brand">{state.success}</p>
      )}
    </form>
  );
}

