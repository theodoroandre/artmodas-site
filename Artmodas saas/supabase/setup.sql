-- LOJACTRL — Supabase Setup
-- Run this in Supabase > SQL Editor

-- Create tables
create table if not exists produtos       (id text primary key, record jsonb not null);
create table if not exists clientes       (id text primary key, record jsonb not null);
create table if not exists vendas         (id text primary key, record jsonb not null);
create table if not exists parcelamentos  (id text primary key, record jsonb not null);
create table if not exists movimentacoes  (id text primary key, record jsonb not null);
create table if not exists logs           (id text primary key, record jsonb not null);

-- Enable Row Level Security and allow anon access
do $$
declare t text;
begin
  foreach t in array array['produtos','clientes','vendas','parcelamentos','movimentacoes','logs']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "anon_all" on %I', t);
    execute format('create policy "anon_all" on %I for all to anon using (true) with check (true)', t);
  end loop;
end $$;

-- Enable real-time for all tables
alter publication supabase_realtime add table produtos;
alter publication supabase_realtime add table clientes;
alter publication supabase_realtime add table vendas;
alter publication supabase_realtime add table parcelamentos;
alter publication supabase_realtime add table movimentacoes;
alter publication supabase_realtime add table logs;
