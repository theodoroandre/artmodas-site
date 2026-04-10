-- Add approved field to user_profiles
-- Run in Supabase > SQL Editor

alter table user_profiles add column if not exists approved boolean not null default false;

-- Approve existing users (so current accounts aren't locked out)
update user_profiles set approved = true;

-- Update trigger: first user = admin + approved, new users = unapproved
create or replace function handle_new_user() returns trigger as $$
declare
  cnt integer;
begin
  select count(*) into cnt from public.user_profiles;
  insert into public.user_profiles (id, email, role, approved, permissions)
  values (
    new.id,
    new.email,
    case when cnt = 0 then 'admin' else 'user' end,
    case when cnt = 0 then true else false end,
    case when cnt = 0
      then '{"painel":{"view":true,"edit":true},"estoque":{"view":true,"edit":true},"vendas":{"view":true,"edit":true},"clientes":{"view":true,"edit":true},"cobrancas":{"view":true,"edit":true},"logs":{"view":true,"edit":true}}'::jsonb
      else '{"painel":{"view":true,"edit":false},"estoque":{"view":true,"edit":false},"vendas":{"view":true,"edit":false},"clientes":{"view":true,"edit":false},"cobrancas":{"view":true,"edit":false},"logs":{"view":false,"edit":false}}'::jsonb
    end
  );
  return new;
end;
$$ language plpgsql security definer;
