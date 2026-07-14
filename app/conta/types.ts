/**
 * Types compartilhados entre /conta/actions.ts (server-only) e os
 * formularios cliente. Sem dependencia em modulos server-only, entao
 * pode ser importado de qualquer componente.
 */

export type ContaState = { error?: string; success?: string } | undefined;

export type AvatarState =
  | { error?: string; success?: string; url?: string }
  | undefined;
