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
Unusual pattern: every table uses a single `record` JSONB column for all domain data (no normalized columns):
- `produtos`, `clientes`, `vendas`, `parcelamentos`, `movimentacoes`, `logs`
- `user_profiles` — linked to `auth.users` (id, email, name, role, permissions JSONB, approved boolean)

SQL migrations live in `/supabase/`.

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
