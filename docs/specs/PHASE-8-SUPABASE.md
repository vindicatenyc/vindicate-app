# Phase 8: Self-Hosted Supabase — Database, Auth & Data Layer

## Overview

Replace mock data with a real persistence layer using self-hosted Supabase (Docker).
Add authentication (email/password), authorization (RLS), and seed the demo user
with all existing mock data.

## Architecture

```
Browser → Caddy (:8443 TLS) → Next.js (:3000)
                                    ↓
                              Supabase Client
                                    ↓
                          ┌─────────────────────┐
                          │   Supabase Stack     │
                          │   (Docker Compose)   │
                          │                      │
                          │  PostgreSQL (:5432)   │
                          │  GoTrue Auth (:9999)  │
                          │  PostgREST (:3001)    │
                          │  Storage API (:5000)  │
                          │  Studio (:8082)       │
                          └─────────────────────┘
```

## Tasks

### 8.1: Self-Hosted Supabase Setup (Docker Compose)
- Create `supabase/` directory at repo root
- Docker Compose with: PostgreSQL 15, GoTrue, PostgREST, Storage API, Meta, Studio
- `.env.example` with required secrets (JWT secret, anon key, service key, DB password)
- Generate actual secrets for local dev in `.env` (gitignored)
- Studio accessible at localhost:8082 for DB management
- Health check script
- Add to .gitignore: `supabase/.env`, `supabase/volumes/`

### 8.2: Database Schema & Migrations
Map existing TypeScript types to Postgres tables:

**Tables:**
- `auth.users` — managed by GoTrue (email, password, metadata)
- `public.profiles` — extends auth.users (name, state, avatar, onboarding_complete, notification_prefs, theme)
- `public.accounts` — debt accounts (all fields from Account interface)
- `public.activities` — activity log entries (all fields from Activity interface)
- `public.cases` — legal/dispute cases (all fields from VindicateCase interface)
- `public.documents` — uploaded documents metadata (all fields from Document interface)
- `public.budget_income` — income entries
- `public.budget_expenses` — expense entries  
- `public.savings_goals` — savings goals
- `public.credit_scores` — credit score snapshots
- `public.notifications` — user notifications
- `public.vinny_messages` — chat history with Vinny

**Key design:**
- All `public.*` tables have `user_id UUID REFERENCES auth.users(id)` column
- `created_at` and `updated_at` timestamps on all tables (with trigger for updated_at)
- Proper indexes on user_id, foreign keys, and commonly filtered columns
- JSONB columns for flexible nested data (harassment_details, status_changes, credit_factors)
- Enums as Postgres custom types matching TypeScript union types

SQL migrations in `supabase/migrations/` numbered sequentially.

### 8.3: Row Level Security (RLS)
- Enable RLS on ALL public tables
- Policy: users can only SELECT/INSERT/UPDATE/DELETE their own rows (`auth.uid() = user_id`)
- Service role bypasses RLS (for admin/seed operations)
- No cross-user data access possible
- Test with SQL to verify isolation

### 8.4: Authentication Integration
- Install `@supabase/supabase-js` in web package
- Create `packages/web/src/lib/supabase/client.ts` — browser client
- Create `packages/web/src/lib/supabase/server.ts` — server-side client (for SSR)
- Create auth pages:
  - `/auth/login` — email + password login
  - `/auth/register` — registration with email + password
  - `/auth/forgot-password` — password reset request
- Auth middleware: protect all app routes, redirect unauthenticated users to `/auth/login`
- Session management via Supabase Auth (JWT cookies)
- Remove Caddy basic auth dependency (Supabase Auth replaces it)
- Store user profile in `profiles` table (auto-created on registration via trigger)
- Update onboarding wizard to save profile data to DB

### 8.5: Hook Rewrites (Mock → Supabase)
Rewrite all hooks to use Supabase queries instead of mock data:

- `use-accounts.ts` → `supabase.from('accounts').select/insert/update/delete`
- `use-activities.ts` → `supabase.from('activities')...`
- `use-cases.ts` → `supabase.from('cases')...`
- `use-budget.ts` → `supabase.from('budget_income/budget_expenses')...`
- `use-credit-score.ts` → `supabase.from('credit_scores')...`
- `use-notifications.ts` → `supabase.from('notifications')...`
- `use-documents.ts` → `supabase.from('documents')...` + Supabase Storage for files

**Key principles:**
- Keep hook API signatures identical — no UI changes needed
- Use React hooks + Supabase realtime subscriptions where beneficial
- Optimistic updates for better UX
- Error handling with user-friendly messages
- Loading states maintained

### 8.6: Demo User Seed
- Create seed script: `supabase/seed.sql`
- Demo user: `demo@vindicate.nyc` / password: `vindicate-demo-2026`
- Insert ALL existing mock data (accounts, activities, cases, budget, credit scores, notifications, documents, savings goals) into demo user's rows
- Map all mock data IDs to consistent UUIDs
- Seed runs automatically on `docker compose up` (or via explicit command)
- Demo user flag in profile so app can show "Demo Mode" indicator

## Non-Goals (Phase 8)
- No real file upload processing (still mock file metadata, but schema ready)
- No email sending (password reset shows success but doesn't send)
- No real Vinny AI (still keyword matching)
- No multi-tenant admin panel

## Acceptance Criteria
- [ ] `docker compose up` starts full Supabase stack
- [ ] Supabase Studio accessible at localhost:8082
- [ ] All tables created with proper schema, indexes, and constraints
- [ ] RLS enabled and verified on all tables
- [ ] Registration creates user + profile
- [ ] Login/logout works with session persistence
- [ ] All app routes protected (redirect to login if unauthenticated)
- [ ] All hooks fetch real data from Postgres
- [ ] Demo user seeded with full mock dataset
- [ ] Zero TypeScript errors
- [ ] Existing UI unchanged (no visual regressions)
