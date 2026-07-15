"use client";

import { useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";

import { clearLeads } from "@/app/leads/actions";
import { Button } from "@/components/ui/button";

/**
 * Botao "Limpar leads" — apaga TODOS os leads gravados no card
 * `validacao/leads`. Útil apos testes para comecar do zero.
 */
export function ClearLeadsButton() {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (
      !window.confirm(
        "Tem certeza? Isso apaga TODOS os leads que os agentes trouxeram. Nao da pra desfazer.",
      )
    ) {
      return;
    }
    startTransition(async () => {
      await clearLeads();
    });
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={isPending}
    >
      {isPending ? (
        <Loader2 className="size-4 animate-spin" aria-hidden />
      ) : (
        <Trash2 className="size-4" aria-hidden />
      )}
      {isPending ? "Limpando..." : "Limpar todos os leads"}
    </Button>
  );
}
