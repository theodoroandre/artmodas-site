-- LOJACTRL — Security Hardening Tests
--
-- Self-contained RLS / privilege-escalation tests. Run AFTER applying
-- security-hardening.sql. Wraps everything in BEGIN/ROLLBACK so no
-- test data persists (auth.users + user_profiles inserts are reverted).
--
-- How to run:
--   Paste this whole file into Supabase Dashboard → SQL Editor → Run.
--   Look for "All tests passed." in the notices, or a TEST FAILED exception.

begin;

-- ============================================================
-- Sanity check: migration applied?
-- ============================================================
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'user_profiles'
      and policyname = 'user_profiles_select_self_or_admin'
  ) then
    raise exception 'security-hardening.sql not applied yet — run that first';
  end if;

  if not exists (
    select 1 from pg_proc
    where proname = 'is_admin' and pronamespace = 'public'::regnamespace
  ) then
    raise exception 'public.is_admin() missing — security-hardening.sql not applied';
  end if;
end $$;

-- ============================================================
-- Helpers (live in pg_temp, gone at transaction end)
-- ============================================================
create function pg_temp.t_pass(msg text) returns void language plpgsql as $$
begin raise notice '  PASS  %', msg; end $$;

create function pg_temp.t_fail(msg text) returns void language plpgsql as $$
begin raise exception 'TEST FAILED: %', msg; end $$;

create function pg_temp.assert_true(cond boolean, msg text) returns void language plpgsql as $$
begin
  if cond then perform pg_temp.t_pass(msg);
  else perform pg_temp.t_fail(msg);
  end if;
end $$;

create function pg_temp.assert_blocked(stmt text, expected_msg text) returns void
language plpgsql as $$
begin
  begin
    execute stmt;
  exception when others then
    if sqlerrm ilike '%' || expected_msg || '%' then
      perform pg_temp.t_pass(format('blocked as expected: %s', sqlerrm));
      return;
    else
      perform pg_temp.t_fail(format('blocked but wrong message — expected "%s", got "%s"', expected_msg, sqlerrm));
      return;
    end if;
  end;
  perform pg_temp.t_fail(format('expected block matching "%s" but statement succeeded', expected_msg));
end $$;

create function pg_temp.act_as(uid uuid) returns void language plpgsql as $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', uid::text, 'role', 'authenticated', 'aud', 'authenticated')::text,
    true
  );
end $$;

create function pg_temp.act_as_postgres() returns void language plpgsql as $$
begin
  reset role;
  perform set_config('request.jwt.claims', '', true);
end $$;

-- ============================================================
-- Setup: create 3 test users (admin / approved / pending)
-- handle_new_user trigger auto-creates user_profiles rows;
-- we then upsert them into the exact state we need.
-- ============================================================
do $setup$
declare
  admin_uid   uuid := gen_random_uuid();
  user_uid    uuid := gen_random_uuid();
  pending_uid uuid := gen_random_uuid();
  stamp       text := extract(epoch from clock_timestamp())::bigint::text;
begin
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data, is_super_admin
  ) values
    (admin_uid,   '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'sec-admin-'   || stamp || '@test.invalid', '', now(), now(), now(), '{}'::jsonb, '{}'::jsonb, false),
    (user_uid,    '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'sec-user-'    || stamp || '@test.invalid', '', now(), now(), now(), '{}'::jsonb, '{}'::jsonb, false),
    (pending_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'sec-pending-' || stamp || '@test.invalid', '', now(), now(), now(), '{}'::jsonb, '{}'::jsonb, false);

  -- Force exact state (overrides whatever handle_new_user set).
  insert into public.user_profiles (id, email, name, role, approved, permissions) values
    (admin_uid,   'sec-admin-'   || stamp || '@test.invalid', 'sec-admin',   'admin', true,  '{}'::jsonb),
    (user_uid,    'sec-user-'    || stamp || '@test.invalid', 'sec-user',    'user',  true,  '{}'::jsonb),
    (pending_uid, 'sec-pending-' || stamp || '@test.invalid', 'sec-pending', 'user',  false, '{}'::jsonb)
  on conflict (id) do update set
    role        = excluded.role,
    approved    = excluded.approved,
    email       = excluded.email,
    name        = excluded.name,
    permissions = excluded.permissions;

  perform set_config('test.admin_uid',   admin_uid::text,   true);
  perform set_config('test.user_uid',    user_uid::text,    true);
  perform set_config('test.pending_uid', pending_uid::text, true);
end $setup$;

-- ============================================================
-- TESTS
-- ============================================================
do $tests$
declare
  admin_uid   uuid := current_setting('test.admin_uid')::uuid;
  user_uid    uuid := current_setting('test.user_uid')::uuid;
  pending_uid uuid := current_setting('test.pending_uid')::uuid;
  row_count   int;
begin
  raise notice '';
  raise notice '── user_profiles: privilege escalation blocked ──';

  -- 1. Non-admin cannot escalate own role to admin
  perform pg_temp.act_as(user_uid);
  perform pg_temp.assert_blocked(
    format($s$update public.user_profiles set role='admin' where id='%s'$s$, user_uid),
    'only admins can change role'
  );

  -- 2. Pending user cannot self-approve
  perform pg_temp.act_as(pending_uid);
  perform pg_temp.assert_blocked(
    format($s$update public.user_profiles set approved=true where id='%s'$s$, pending_uid),
    'only admins can change approved'
  );

  -- 3. Non-admin cannot grant own permissions
  perform pg_temp.act_as(user_uid);
  perform pg_temp.assert_blocked(
    format($s$update public.user_profiles set permissions='{"all":true}'::jsonb where id='%s'$s$, user_uid),
    'only admins can change permissions'
  );

  raise notice '';
  raise notice '── user_profiles: legitimate self-edits work ──';

  -- 4. Non-admin CAN update own non-privileged fields
  perform pg_temp.act_as(user_uid);
  execute format($s$update public.user_profiles set name='renamed' where id='%s'$s$, user_uid);
  perform pg_temp.act_as_postgres();
  select count(*) into row_count from public.user_profiles where id = user_uid and name = 'renamed';
  perform pg_temp.assert_true(row_count = 1, 'non-admin can rename own profile');

  raise notice '';
  raise notice '── user_profiles: row visibility ──';

  -- 5. Non-admin can only see own profile row
  perform pg_temp.act_as(user_uid);
  select count(*) into row_count from public.user_profiles where id in (admin_uid, user_uid, pending_uid);
  perform pg_temp.assert_true(row_count = 1, 'non-admin sees only self in user_profiles');

  -- 6. Admin sees all profiles
  perform pg_temp.act_as(admin_uid);
  select count(*) into row_count from public.user_profiles where id in (admin_uid, user_uid, pending_uid);
  perform pg_temp.assert_true(row_count = 3, 'admin sees all profiles');

  raise notice '';
  raise notice '── user_profiles: admin can manage others ──';

  -- 7. Admin can approve another user
  perform pg_temp.act_as(admin_uid);
  execute format($s$update public.user_profiles set approved=true where id='%s'$s$, pending_uid);
  perform pg_temp.act_as_postgres();
  select count(*) into row_count from public.user_profiles where id = pending_uid and approved = true;
  perform pg_temp.assert_true(row_count = 1, 'admin can approve pending user');

  -- 8. Admin can change role on another user
  perform pg_temp.act_as(admin_uid);
  execute format($s$update public.user_profiles set role='admin' where id='%s'$s$, user_uid);
  perform pg_temp.act_as_postgres();
  select count(*) into row_count from public.user_profiles where id = user_uid and role = 'admin';
  perform pg_temp.assert_true(row_count = 1, 'admin can promote another user');

  -- Revert demo changes to keep downstream tests deterministic.
  update public.user_profiles set role = 'user'  where id = user_uid;
  update public.user_profiles set approved = false where id = pending_uid;

  raise notice '';
  raise notice '── data tables: approval gate ──';

  -- 9. Approved user can read produtos (RLS allows)
  perform pg_temp.act_as(user_uid);
  begin
    perform 1 from public.produtos limit 1;
    perform pg_temp.t_pass('approved user can SELECT from produtos');
  exception when others then
    perform pg_temp.t_fail('approved user blocked from produtos: ' || sqlerrm);
  end;

  -- 10. Unapproved user sees 0 rows
  perform pg_temp.act_as(pending_uid);
  select count(*) into row_count from public.produtos;
  perform pg_temp.assert_true(row_count = 0, 'unapproved user sees 0 rows in produtos');

  -- 11. Unapproved user blocked from INSERT (with check fails)
  perform pg_temp.act_as(pending_uid);
  perform pg_temp.assert_blocked(
    $s$insert into public.produtos (id, nome) values ('sec-test-prod', 'x')$s$,
    'row-level security'
  );

  raise notice '';
  raise notice '── SECURITY DEFINER functions: not callable via RPC ──';

  -- 12. handle_new_user direct call blocked for authenticated
  perform pg_temp.act_as(user_uid);
  perform pg_temp.assert_blocked(
    'select public.handle_new_user()',
    'permission denied'
  );

  -- 13. rls_auto_enable direct call blocked (if function exists)
  if exists (
    select 1 from pg_proc
    where proname = 'rls_auto_enable' and pronamespace = 'public'::regnamespace
  ) then
    perform pg_temp.act_as(user_uid);
    perform pg_temp.assert_blocked(
      'select public.rls_auto_enable()',
      'permission denied'
    );
  else
    raise notice '  SKIP  rls_auto_enable not present';
  end if;

  -- 14. is_admin helper not callable by anon
  perform pg_temp.act_as_postgres();
  perform set_config('role', 'anon', true);
  perform pg_temp.assert_blocked(
    'select public.is_admin()',
    'permission denied'
  );

  perform pg_temp.act_as_postgres();

  raise notice '';
  raise notice '────────────────────────';
  raise notice 'All tests passed.';
end $tests$;

rollback;  -- discards all test data (auth.users + user_profiles inserts)
