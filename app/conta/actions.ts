"use server";

/**
 * Acoes da pagina /conta — atualizam o profile da founder no Supabase.
 * Server-only; chamadas apenas via form action.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

// Re-exporta os tipos para nao quebrar imports existentes que ainda
// referenciam `ContaState` / `AvatarState` a partir deste modulo.
export type { ContaState, AvatarState } from "@/app/conta/types";
import type { AvatarState, ContaState } from "@/app/conta/types";

/** Limpa e normaliza um nome (trim, colapsa espacos, ate 120 chars). */
function cleanName(value: FormDataEntryValue | null): string | null {
  if (value == null) return null;
  const s = String(value).trim().replace(/\s+/g, " ").slice(0, 120);
  return s.length === 0 ? null : s;
}

function reauthRequired(error: { message: string } | null): boolean {
  if (!error) return false;
  const m = error.message.toLowerCase();
  return (
    m.includes("password") ||
    m.includes("requires") ||
    m.includes("reauthentication") ||
    m.includes("email not confirmed")
  );
}

/** Erro em pt-BR para o toast/UI. */
function localize(err: { message: string } | null, fallback: string): string {
  if (!err) return fallback;
  const m = err.message;
  if (/duplicate key/i.test(m)) return "Esse e-mail ja esta cadastrado.";
  if (/password/i.test(m) && /short|6/.test(m))
    return "A senha precisa ter no minimo 6 caracteres.";
  if (/invalid email/i.test(m)) return "E-mail invalido.";
  return m;
}

/** Retorna o usuario logado ou redireciona para /login. */
async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function updateName(
  _prev: ContaState,
  formData: FormData,
): Promise<ContaState> {
  const { supabase, user } = await requireUser();

  const fullName = cleanName(formData.get("full_name"));

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", user.id);

  if (error) return { error: localize(error, "Erro ao salvar nome.") };
  revalidatePath("/", "layout");
  return { success: "Nome atualizado." };
}

export async function updateEmail(
  _prev: ContaState,
  formData: FormData,
): Promise<ContaState> {
  const { supabase } = await requireUser();

  const newEmail = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!newEmail) return { error: "Informe o novo e-mail." };

  const { error } = await supabase.auth.updateUser({ email: newEmail });

  if (error) {
    if (reauthRequired(error))
      return {
        error:
          "Por seguranca, faca logout e login novamente antes de trocar o e-mail.",
      };
    return { error: localize(error, "Erro ao trocar e-mail.") };
  }
  return {
    success:
      "Pedido de troca de e-mail enviado. Verifique a caixa do novo e-mail para confirmar.",
  };
}

export async function updatePassword(
  _prev: ContaState,
  formData: FormData,
): Promise<ContaState> {
  await requireUser();

  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("password_confirm") ?? "");

  if (password.length < 6)
    return { error: "A senha precisa ter no minimo 6 caracteres." };
  if (password !== confirm)
    return { error: "A confirmacao nao confere com a senha." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) return { error: localize(error, "Erro ao trocar senha.") };
  return { success: "Senha atualizada." };
}

export async function updateAvatar(
  _prev: AvatarState,
  formData: FormData,
): Promise<AvatarState> {
  const { supabase, user } = await requireUser();

  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Selecione uma imagem." };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { error: "A imagem deve ter no maximo 5 MB." };
  }
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowed.includes(file.type)) {
    return { error: "Formato invalido. Use JPEG, PNG, WEBP ou GIF." };
  }

  const ext = file.name.split(".").pop() || "png";
  const path = `${user.id}/avatar-${Date.now()}.${ext}`;

  // Upload no bucket `attachments` (privado) — mesmo bucket usado pelo app.
  const { error: uploadError } = await supabase.storage
    .from("attachments")
    .upload(path, file, {
      upsert: true,
      contentType: file.type,
      cacheControl: "3600",
    });
  if (uploadError)
    return { error: `Falha no upload: ${uploadError.message}` };

  // Grava o caminho no profile (nao a URL — geramos URL assinada na leitura).
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_path: path })
    .eq("id", user.id);
  if (updateError)
    return { error: localize(updateError, "Erro ao salvar foto.") };

  revalidatePath("/", "layout");
  return { success: "Foto atualizada." };
}

export async function removeAvatar(): Promise<AvatarState> {
  const { supabase, user } = await requireUser();

  const { data: row } = await supabase
    .from("profiles")
    .select("avatar_path")
    .eq("id", user.id)
    .maybeSingle();

  const path = row?.avatar_path;
  if (path) {
    await supabase.storage.from("attachments").remove([path]);
  }
  await supabase
    .from("profiles")
    .update({ avatar_path: null })
    .eq("id", user.id);

  revalidatePath("/", "layout");
  return { success: "Foto removida." };
}
