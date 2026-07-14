import { ChatView } from "@/components/chat/chat-view";
import { displayName, getCurrentProfile } from "@/lib/auth/profile";
import { CHAT_ENABLED } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Pagina Principal — estado vazio (SPEC). Sem conversa aberta: saudacao grande
 * + composer centralizados (estilo ChatGPT). No 1o envio, o `ChatView` cria a
 * conversa e navega para `/principal/[id]`.
 *
 * Saudacao usa o `full_name` do profile do usuario logado (preenchido no
 * onboarding) ou o primeiro nome do email como fallback.
 */
export default async function PrincipalPage() {
  const profile = await getCurrentProfile();
  const name = displayName(profile);
  const greeting = name
    ? `Como posso ajudar, ${name}?`
    : "Como posso ajudar?";

  return <ChatView greeting={greeting} chatEnabled={CHAT_ENABLED} />;
}
