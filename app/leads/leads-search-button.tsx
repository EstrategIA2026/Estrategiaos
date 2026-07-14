"use client";

import { useActionState } from "react";
import { Loader2, Sparkles } from "lucide-react";

import { searchLeads, type LeadsSearchState } from "@/app/leads/actions";
import { Button } from "@/components/ui/button";

/**
 * Botao "Buscar leads com IA" — chama Tavily + Claude Fable 5 para gerar
 * novos leads a partir do card `direcao/perfil-ideal-de-cliente`.
 *
 * Client component: usa useActionState para feedback inline.
 */
export function LeadsSearchButton() {
  const [state, formAction, pending] = useActionState<
    LeadsSearchState,
    FormData
  >(searchLeads, undefined);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input
        type="hidden"
        name="limit"
        value="5"
      />
      <Button type="submit" variant="brand" size="sm" disabled={pending}>
        {pending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <Sparkles className="size-4" aria-hidden />
        )}
        {pending ? "Buscando..." : "Buscar leads com IA"}
      </Button>
      {state?.error && (
        <p className="text-xs text-destructive">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-xs text-brand">{state.success}</p>
      )}
    </form>
  );
}
