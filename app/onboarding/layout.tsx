import type { ReactNode } from "react";

import { ThemeToggle } from "@/components/layout/theme-toggle";

/**
 * Layout do onboarding pos-signup. Tela cheia, minimalista, SEM a sidebar do
 * grupo (app): o wizard ocupa todo o viewport, uma pergunta por vez. So o
 * alternador de tema fica visivel, no canto.
 */
export default function OnboardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh flex-col bg-background text-foreground">
      <div className="pointer-events-none absolute right-5 top-5 z-10 md:right-8 md:top-6">
        <div className="pointer-events-auto">
          <ThemeToggle />
        </div>
      </div>
      {children}
    </div>
  );
}
