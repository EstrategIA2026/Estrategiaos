-- ============================================================================
-- BusinessOS — Onboarding do perfil
--
-- Adiciona a `public.profiles` os campos coletados no onboarding pos-signup
-- (nome, whatsapp, empresa, tamanho do time) e um marco `onboarded_at` que
-- sinaliza que o fluxo foi concluido (usado para nao repetir o onboarding).
--
-- Nao cria policies novas: o UPDATE ja e coberto por "profiles_update_own"
-- (o usuario edita o proprio profile via RLS). O INSERT segue exclusivo do
-- trigger handle_new_user(). full_name ja existia — reaproveitado aqui.
-- ============================================================================

alter table public.profiles
  add column if not exists whatsapp       text,
  add column if not exists company_name   text,
  add column if not exists employee_count text,
  add column if not exists onboarded_at   timestamptz;
