-- LOJACTRL — Schema v2 (normalized, no JSONB)
-- Run in Supabase > SQL Editor

-- Drop old tables (clean slate)
drop table if exists logs            cascade;
drop table if exists movimentacoes   cascade;
drop table if exists pagamentos      cascade;
drop table if exists parcelamentos   cascade;
drop table if exists venda_itens     cascade;
drop table if exists vendas          cascade;
drop table if exists clientes        cascade;
drop table if exists produtos        cascade;

-- Products
create table produtos (
  id      text primary key,
  cod     text,
  nome    text not null,
  cat     text,
  custo   numeric(10,2) not null default 0,
  preco   numeric(10,2) not null default 0,
  estoque integer not null default 0,
  minimo  integer not null default 0
);

-- Customers
create table clientes (
  id       text primary key,
  nome     text not null,
  tel      text,
  cpf      text,
  email    text,
  endereco text,
  cad      text
);

-- Sales
create table vendas (
  id     text primary key,
  cli_id text references clientes(id),
  pg     text not null,
  data   text not null,
  n_loja integer not null default 1,
  n_card integer not null default 1,
  total  numeric(10,2) not null default 0
);

-- Sale line items
create table venda_itens (
  id       text primary key,
  venda_id text not null references vendas(id) on delete cascade,
  pid      text not null references produtos(id),
  qty      integer not null,
  preco    numeric(10,2) not null
);

-- Installment plans
create table parcelamentos (
  id       text primary key,
  venda_id text not null references vendas(id) on delete cascade,
  num      integer not null,
  valor    numeric(10,2) not null,
  pago     numeric(10,2) not null default 0,
  vence    text not null
);

-- Payment records
create table pagamentos (
  id     text primary key,
  par_id text not null references parcelamentos(id) on delete cascade,
  val    numeric(10,2) not null,
  data   text not null,
  obs    text
);

-- Stock movements
create table movimentacoes (
  id       text primary key,
  pid      text not null references produtos(id),
  tipo     text not null,
  qty      integer not null,
  data     text not null,
  motivo   text,
  venda_id text references vendas(id)
);

-- Activity log (descr = JS 'desc', avoids SQL reserved word)
create table logs (
  id    text primary key,
  ts    text not null,
  cat   text,
  acao  text,
  descr text
);

-- Enable RLS with anon access (run setup-auth.sql to lock down to authenticated)
do $$
declare t text;
begin
  foreach t in array array['produtos','clientes','vendas','venda_itens','parcelamentos','pagamentos','movimentacoes','logs']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "anon_all" on %I', t);
    execute format('drop policy if exists "auth_all" on %I', t);
    execute format('create policy "anon_all" on %I for all to anon using (true) with check (true)', t);
  end loop;
end $$;

-- Enable real-time
alter publication supabase_realtime add table produtos;
alter publication supabase_realtime add table clientes;
alter publication supabase_realtime add table vendas;
alter publication supabase_realtime add table venda_itens;
alter publication supabase_realtime add table parcelamentos;
alter publication supabase_realtime add table pagamentos;
alter publication supabase_realtime add table movimentacoes;
alter publication supabase_realtime add table logs;
