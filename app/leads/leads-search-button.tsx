"use client";

import { useActionState } from "react";
import { Building2, Loader2, Sparkles, Users } from "lucide-react";

import { searchLeads, type LeadsSearchState } from "@/app/leads/actions";
import { searchLeadsHunter, type LeadsHunterState } from "@/app/leads/actions-hunter";
import { searchLeadsAnahp, type LeadsAnahpState } from "@/app/leads/actions-anahp";
import { Button } from "@/components/ui/button";

/**
 * Botao "Buscar leads com IA" (Tavily) + "Buscar pessoas REAIS" (Hunter.io) +
 * "Buscar hospitais ANHP" (ANHP + Hunter.io).
 *
 * Client component: usa useActionState para feedback inline. Tem Select
 * para a founder escolher a quantidade (5, 10 ou 20).
 */
export function LeadsSearchButton() {
  return (
    <div className="flex flex-col gap-3">
      <AnahpButton />
      <HunterButton />
      <TavilyButton />
    </div>
  );
}

function AnahpButton() {
  const [state, formAction, pending] = useActionState<
    LeadsAnahpState,
    FormData
  >(searchLeadsAnahp, undefined);

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-center gap-2"
    >
      <label
        htmlFor="lead-limit-anahp"
        className="font-mono text-[11px] tracking-wider text-muted-foreground"
      >
        ANHP
      </label>
      <select
        id="lead-limit-anahp"
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
          <Building2 className="size-4" aria-hidden />
        )}
        {pending ? "Buscando..." : "Hospitais ANHP (reais)"}
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

function TavilyButton() {
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
        htmlFor="lead-limit-tavily"
        className="font-mono text-[11px] tracking-wider text-muted-foreground"
      >
        TAVILY
      </label>
      <select
        id="lead-limit-tavily"
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
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {pending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <Sparkles className="size-4" aria-hidden />
        )}
        {pending ? "Buscando..." : "Buscar conteudo (Tavily)"}
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

function HunterButton() {
  const [state, formAction, pending] = useActionState<
    LeadsHunterState,
    FormData
  >(searchLeadsHunter, undefined);

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-center gap-2"
    >
      <label
        htmlFor="lead-limit-hunter"
        className="font-mono text-[11px] tracking-wider text-muted-foreground"
      >
        HUNTER
      </label>
      <select
        id="lead-limit-hunter"
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
          <Users className="size-4" aria-hidden />
        )}
        {pending ? "Buscando..." : "Buscar pessoas REAIS (Hunter)"}
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

