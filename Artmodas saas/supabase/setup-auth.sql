-- LOJACTRL — Auth Setup (run after setup.sql)
-- Supabase > SQL Editor

-- 1. User profiles table
create table if not exists user_profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  name text,
  role text not null default 'user',   -- 'admin' | 'user'
  permissions jsonb not null default '{}'
);

alter table user_profiles enable row level security;
create policy "auth_all" on user_profiles for all to authenticated using (true) with check (true);

-- 2. Trigger: first user = admin (all permissions), others = user (view-only defaults)
create or replace function handle_new_user() returns trigger as $$
declare
  cnt integer;
begin
  select count(*) into cnt from public.user_profiles;
  insert into public.user_profiles (id, email, role, permissions)
  values (
    new.id,
    new.email,
    case when cnt = 0 then 'admin' else 'user' end,
    case when cnt = 0
      then '{"painel":{"view":true,"edit":true},"estoque":{"view":true,"edit":true},"vendas":{"view":true,"edit":true},"clientes":{"view":true,"edit":true},"cobrancas":{"view":true,"edit":true},"logs":{"view":true,"edit":true}}'::jsonb
      else '{"painel":{"view":true,"edit":false},"estoque":{"view":true,"edit":false},"vendas":{"view":true,"edit":false},"clientes":{"view":true,"edit":false},"cobrancas":{"view":true,"edit":false},"logs":{"view":false,"edit":false}}'::jsonb
    end
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- 3. Update data tables RLS: require authentication (replaces anon_all policies)
do $$
declare t text;
begin
  foreach t in array array['produtos','clientes','vendas','parcelamentos','movimentacoes','logs']
  loop
    execute format('drop policy if exists "anon_all" on %I', t);
    execute format('create policy "auth_all" on %I for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;
