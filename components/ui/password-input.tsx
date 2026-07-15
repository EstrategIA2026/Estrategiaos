"use client";

import { Eye, EyeOff } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Input de senha com botao de mostrar/ocultar (olhinho).
 *
 * - Visual: borda seca, cantos vivos, foco laranja — casou com o resto.
 * - Icone: alterna entre Eye/EyeOff (lucide) na cor da marca.
 * - Mantem o resto da API identica a `<input>` (ref, className, props).
 */
const PasswordInput = React.forwardRef<HTMLInputElement, Omit<React.ComponentProps<"input">, "type">>(
  ({ className, ...props }, ref) => {
    const [visible, setVisible] = React.useState(false);
    return (
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          ref={ref}
          className={cn(
            "flex h-11 w-full rounded-lg border border-input bg-muted px-4 py-2 pr-11 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-brand disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          {...props}
        />
        <button
          type="button"
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          aria-pressed={visible}
          onClick={() => setVisible((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex size-8 items-center justify-center rounded-md text-brand transition-colors hover:bg-brand-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {visible ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
        </button>
      </div>
    );
  },
);
PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
