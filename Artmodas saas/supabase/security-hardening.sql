-- LOJACTRL — Security Hardening
-- Run after setup.sql and setup-auth.sql.
-- Run inside transaction first with ROLLBACK to validate, then COMMIT.
--
-- Fixes Supabase Security Advisor findings:
--  * rls_policy_always_true on user_profiles (privilege escalation)
--  * rls_policy_always_true on 8 data tables (hardened to require approved=true)
--  * function_search_path_mutable on handle_new_user
--  * *_security_definer_function_executable on handle_new_user and rls_auto_enable

begin;

-- ============================================================
-- 1. Helper: is_admin() — used by policies, avoids RLS recursion
-- ============================================================
create or replace function public.is_admin() returns boolean
  language sql
  security definer
  set search_path = public, pg_temp
  stable
as $$
  select coalesce(
    (select role = 'admin' and approved from public.user_profiles where id = auth.uid()),
    false
  );
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- ============================================================
-- 2. Harden handle_new_user
-- ============================================================
alter function public.handle_new_user() set search_path = public, pg_temp;
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- ============================================================
-- 3. Harden rls_auto_enable (only if present)
-- ============================================================
do $$
begin
  if exists (
    select 1 from pg_proc
    where proname = 'rls_auto_enable'
      and pronamespace = 'public'::regnamespace
  ) then
    execute 'revoke all on function public.rls_auto_enable() from public, anon, authenticated';
  end if;
end $$;

-- ============================================================
-- 4. user_profiles — replace permissive policy with granular ones
-- ============================================================
drop policy if exists "anon_all"                                on public.user_profiles;
drop policy if exists "auth_all"                                on public.user_profiles;
drop policy if exists "user_profiles_select_self_or_admin"      on public.user_profiles;
drop policy if exists "user_profiles_update_self_or_admin"      on public.user_profiles;
drop policy if exists "user_profiles_delete_admin"              on public.user_profiles;

create policy "user_profiles_select_self_or_admin"
  on public.user_profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

create policy "user_profiles_update_self_or_admin"
  on public.user_profiles
  for update to authenticated
  using      (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

create policy "user_profiles_delete_admin"
  on public.user_profiles
  for delete to authenticated
  using (public.is_admin());

-- INSERT: no policy = denied for authenticated/anon (trigger inserts via
-- SECURITY DEFINER bypass).

-- ============================================================
-- 5. Trigger: block non-admin from changing role/approved/permissions
--    (UPDATE policy above lets self-edits through; trigger enforces
--    field-level restrictions because RLS has no per-column granularity.)
-- ============================================================
create or replace function public.user_profiles_protect_privileged_fields() returns trigger
  language plpgsql
  security definer
  set search_path = public, pg_temp
as $$
begin
  -- No auth context = dashboard SQL / service_role / migrations: allow.
  if auth.uid() is null then
    return new;
  end if;

  -- Admin: full access.
  if public.is_admin() then
    return new;
  end if;

  -- Non-admin authenticated: privileged fields are immutable.
  if new.role is distinct from old.role then
    raise exception 'permission denied: only admins can change role';
  end if;
  if new.approved is distinct from old.approved then
    raise exception 'permission denied: only admins can change approved';
  end if;
  if new.permissions is distinct from old.permissions then
    raise exception 'permission denied: only admins can change permissions';
  end if;

  return new;
end;
$$;

revoke all on function public.user_profiles_protect_privileged_fields() from public, anon, authenticated;

drop trigger if exists user_profiles_protect on public.user_profiles;
create trigger user_profiles_protect
  before update on public.user_profiles
  for each row execute function public.user_profiles_protect_privileged_fields();

-- ============================================================
-- 6. Data tables — require approved=true (defense in depth vs UI gate)
-- ============================================================
do $$
declare t text;
begin
  foreach t in array array[
    'produtos','clientes','vendas','venda_itens',
    'parcelamentos','pagamentos','movimentacoes','logs'
  ] loop
    execute format('drop policy if exists "anon_all"            on public.%I', t);
    execute format('drop policy if exists "auth_all"            on public.%I', t);
    execute format('drop policy if exists "approved_users_all"  on public.%I', t);
    execute format($f$
      create policy "approved_users_all" on public.%I
        for all to authenticated
        using      (exists (select 1 from public.user_profiles where id = auth.uid() and approved))
        with check (exists (select 1 from public.user_profiles where id = auth.uid() and approved))
    $f$, t);
  end loop;
end $$;

-- ============================================================
-- Done. Inspect end state, then ROLLBACK or COMMIT.
-- ============================================================
-- ROLLBACK;   -- first run: validate
-- COMMIT;     -- second run: apply
