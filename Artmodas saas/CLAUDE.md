# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**LOJACTRL** — A SaaS inventory and sales management system for Artmodas, a fashion retail business. The UI is in Portuguese.

## Commands

```bash
npm run dev       # Start dev server (Vite)
npm run build     # Production build
npm run preview   # Preview built app
```

No test or lint scripts are configured.

## Architecture

### Tech Stack
- **React 19** + **Vite 6** — SPA, no SSR, no TypeScript
- **Supabase** — PostgreSQL + real-time subscriptions + auth (no ORM, direct SQL client)
- **html5-qrcode** — barcode/QR scanning

### Deployment
The app is deployed at a subpath (`base: "/artmodas-site/"` in `vite.config.js`). The build output goes to `/dist`.

### State & Data Flow
All server state is managed in `src/useSupabase.js`, a single large hook that:
- Connects to Supabase (credentials stored in `localStorage` and set via UI)
- Subscribes to real-time changes on all tables
- Exposes CRUD helpers used throughout the app

Authentication state lives in `src/useAuth.js`.

### Database Schema (Supabase/PostgreSQL)
Normalized schema — each domain concept has its own table with typed columns (no JSONB blobs for domain data). Tables:
- `produtos` (id, cod, nome, cat, custo, preco, estoque, minimo)
- `clientes` (id, nome, tel, cpf, email, endereco, cad)
- `vendas` (id, cli_id → clientes, pg, data, n_loja, n_card, total)
- `venda_itens` (id, venda_id → vendas, pid → produtos, qty, preco) — junction for sale line items
- `parcelamentos` (id, venda_id → vendas, num, valor, pago, vence)
- `pagamentos` (id, par_id → parcelamentos, val, data, obs)
- `movimentacoes` (id, pid → produtos, tipo, qty, data, motivo, venda_id → vendas)
- `logs` (id, ts, cat, acao, descr) — note: column is `descr`, not `desc` (SQL reserved word)
- `user_profiles` — linked to `auth.users` (id, email, name, role, approved, permissions JSONB)

`user_profiles.permissions` is still JSONB because the permission map is dynamic (one key per module). Domain tables are fully normalized.

SQL migrations live in `/supabase/`:
- `setup.sql` — creates all data tables + RLS (initially with `anon_all` policy)
- `setup-auth.sql` — creates `user_profiles`, signup trigger, swaps `anon_all` → `auth_all` on data tables
- `security-hardening.sql` — final policy model (run after the two above). Replaces permissive `auth_all` with: granular `user_profiles` policies (`is_admin()` helper + BEFORE UPDATE trigger blocking non-admin from changing `role`/`approved`/`permissions`); data tables require `approved=true`; revokes API access on `handle_new_user`/`rls_auto_enable`; pins `search_path` on `handle_new_user`.

**Known accepted Security Advisor warning:** `public.is_admin()` is flagged as `authenticated_security_definer_function_executable` — by design. The function only returns a boolean about the *caller's own* admin status (info the caller could derive from their own `user_profiles` row anyway). Kept in `public` so RLS policies / trigger can use it; moving to a `private` schema would silence the lint but adds schema indirection for no real gain.
- `tests/security-hardening.test.sql` — pgTAP-style assertions (privilege escalation blocked, admin/user/pending access, RPC blocks). Wrapped in `BEGIN…ROLLBACK` — paste into the SQL Editor and run; no data persists.

### Adding new tables to Supabase

**Important — Supabase Data API default change (2026-10-30):** After this date, tables in `public` are no longer auto-exposed to PostgREST / supabase-js. New tables need explicit `GRANT`s. Existing tables (the 9 above) keep working.

Standard pattern for any new table:

```sql
create table public.nova_tabela (
  id text primary key,
  -- ...
);

-- 1. RLS always on
alter table public.nova_tabela enable row level security;

-- 2. Policy — match the existing convention (authenticated full access)
create policy "auth_all" on public.nova_tabela
  for all to authenticated using (true) with check (true);

-- 3. Explicit GRANT — required from 2026-10-30 onward
grant select, insert, update, delete on public.nova_tabela to authenticated;

-- 4. Realtime, if the table needs live updates in the UI
alter publication supabase_realtime add table public.nova_tabela;
```

Before 2026-10-30, run the **Security Advisor** in the Supabase dashboard to confirm which tables are currently exposed to the Data API and catch anything missing an explicit grant.

### Authentication & Authorization
- Supabase email/password auth
- First user to sign up becomes admin (auto-approved via DB trigger)
- New users are blocked until an admin approves them (`approved` field in `user_profiles`)
- Role-based permissions per module (painel, estoque, vendas, clientes, cobrancas, logs) stored as JSONB in `user_profiles`
- `AdminPanel.jsx` is admin-only for user management

### Component Structure
`src/App.jsx` is the root with screen routing. Each main screen has a dedicated component (`Painel`, `Estoque`, `Vendas`, `Clientes`, `Cobrancas`, `Logs`, `AdminPanel`). CRUD operations open modals (`VendaModal`, `EntradaModal`, `CliModal`, `ProdModal`, `DetCliModal`, `PagarModal`).

### Google Sheets Integration (Legacy)
`src/useGoogleSheets.js` mirrors data to a deployed Google Apps Script (`/google-apps-script/Code.gs`). This is optional and password-protected. Credentials come from `localStorage`.

### Constants & Utilities
- `src/constants.js` — payment types and status helpers
- `src/utils.js` — uid generation, currency formatting, date utilities
