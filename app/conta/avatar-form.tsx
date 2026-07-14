"use client";

import { useActionState, useRef } from "react";
import Image from "next/image";
import { Camera, Trash2, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  removeAvatar,
  updateAvatar,
} from "@/app/conta/actions";
import type { AvatarState } from "@/app/conta/types";

/**
 * Formulario de upload/remove de avatar. Recebe o `avatarUrl` (signed URL
 * do bucket privado) e mostra a foto real. Upload delega ao server action.
 */
export function AvatarForm({
  email,
  avatarPath,
  avatarUrl,
}: {
  email: string;
  avatarPath: string | null;
  avatarUrl: string | null;
}) {
  const [state, formAction, pending] = useActionState<AvatarState, FormData>(
    updateAvatar,
    undefined,
  );
  const fileRef = useRef<HTMLInputElement>(null);

  const iniciais = (email[0] ?? "?").toUpperCase();

  return (
    <div className="rounded-md border bg-card p-6 scia-card">
      <h2 className="mb-4 font-display text-lg font-extrabold">Foto de perfil</h2>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted font-display text-2xl font-extrabold text-brand">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt="Foto de perfil"
              fill
              sizes="96px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <span>{iniciais}</span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <form action={formAction} className="flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              name="avatar"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) e.currentTarget.form?.requestSubmit();
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
              disabled={pending}
            >
              <Camera className="size-4" aria-hidden />
              {avatarPath ? "Trocar foto" : "Enviar foto"}
            </Button>
            {avatarPath && (
              <form action={removeAvatar}>
                <Button type="submit" variant="ghost" size="sm" disabled={pending}>
                  <Trash2 className="size-4" aria-hidden />
                  Remover
                </Button>
              </form>
            )}
          </form>
          <p className="font-mono text-[11px] tracking-wider text-muted-foreground">
            JPEG, PNG, WEBP ou GIF · max 5 MB
          </p>
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          {state?.success && (
            <p className="text-sm text-brand">{state.success}</p>
          )}
        </div>
      </div>
    </div>
  );
}
