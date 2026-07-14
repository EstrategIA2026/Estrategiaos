import { redirect } from "next/navigation";
import { ArrowLeft, LogOut } from "lucide-react";

import { SciaTitle } from "@/components/ui/scia-title";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AvatarForm } from "@/app/conta/avatar-form";
import { EmailForm, NameForm, PasswordForm } from "@/app/conta/forms";
import { getCurrentProfile } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Pagina /conta — edicao de perfil, e-mail, senha e foto.
 * Server Component: le o profile e renderiza os formularios cliente.
 */
export default async function ContaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  // Pega o avatar_path e gera signed URL (bucket privado).
  const { data: row } = await supabase
    .from("profiles")
    .select("avatar_path")
    .eq("id", profile.id)
    .maybeSingle();

  let avatarUrl: string | null = null;
  if (row?.avatar_path) {
    const { data: signed } = await supabase.storage
      .from("attachments")
      .createSignedUrl(row.avatar_path, 60 * 60);
    avatarUrl = signed?.signedUrl ?? null;
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12 md:py-16">
        <header className="relative mb-12">
          <div className="absolute right-0 top-0">
            <Button asChild variant="outline" size="sm">
              <Link href="/founder">
                <ArrowLeft className="size-4" aria-hidden />
                Voltar
              </Link>
            </Button>
          </div>
          <p className="scia-tag mb-4">[ CONTA ]</p>
          <SciaTitle as="h1">Sua conta</SciaTitle>
          <p className="mt-3 text-base text-muted-foreground">
            Edite seu nome, e-mail, senha e foto de perfil.
          </p>
        </header>

        <div className="space-y-6">
          <AvatarForm
            email={profile.email}
            avatarPath={row?.avatar_path ?? null}
            avatarUrl={avatarUrl}
          />
          <NameForm initialName={profile.fullName ?? ""} />
          <EmailForm email={profile.email} />
          <PasswordForm />

          <div className="rounded-md border bg-card p-6 scia-card">
            <h2 className="mb-1 font-display text-lg font-extrabold">
              Encerrar sessao
            </h2>
            <p className="mb-4 font-mono text-[11px] tracking-wider text-muted-foreground">
              Sai do BusinessOS neste navegador.
            </p>
            <form action="/auth/signout" method="post">
              <Button type="submit" variant="outline">
                <LogOut className="size-4" aria-hidden /> Sair da conta
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
