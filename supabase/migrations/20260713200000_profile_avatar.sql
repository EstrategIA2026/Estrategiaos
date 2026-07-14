-- ============================================================================
-- Adiciona avatar_path ao profile para suportar upload de foto do usuario.
-- Bucket `attachments` ja existe (storage privado). Caminho segue o padrao
-- `<user_id>/avatar-<timestamp>.<ext>` para colisao zero.
-- ============================================================================

alter table public.profiles
  add column if not exists avatar_path text;

-- Funcao SECURITY DEFINER para checar avatar_path sem expor o schema.
-- Sem isso: a policy "profiles_select_own" ja cobre a leitura pelo dono.
create or replace function public.get_avatar_path(target_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select avatar_path from public.profiles where id = target_id;
$$;
revoke execute on function public.get_avatar_path(uuid) from public, anon;
grant execute on function public.get_avatar_path(uuid) to authenticated;
