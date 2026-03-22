# Fit Track Architecture

## Stack

- React + Vite + TypeScript
- PWA with `vite-plugin-pwa`
- Supabase for auth, Postgres and storage
- React Query for server state
- Dexie / IndexedDB for offline queue and local cache

## Product Principles

- Mobile-first interaction model
- Offline-first logging for core entries
- Fast add flows for daily use
- Simple domain model before advanced AI or recommendation features

## Feature Modules

- `dashboard`
- `weight`
- `nutrition`
- `workouts`
- `measurements`
- `auth`

## Data Flow

1. User logs an entry locally.
2. Entry is stored optimistically in local state / IndexedDB.
3. App sync layer writes to Supabase when online.
4. Query invalidation refreshes views from canonical backend state.

## Supabase Local Workflow

- Local config lives in `supabase/config.toml`.
- Schema and policy changes live in `supabase/migrations/`.
- Rebuild the local database with `npx supabase db reset` after migration changes.
- Use `docs/supabase-local-setup.md` for the full bootstrap and reset flow.

## First Delivery Milestones

1. Auth and profile bootstrap
2. Weight entry CRUD
3. Nutrition entry CRUD
4. Workout session CRUD
5. Measurements CRUD
6. Dashboard aggregation
7. Offline queue replay and conflict strategy
