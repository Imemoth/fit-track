# Fit Track

Mobilközpontú fitneszkövető app, amelyet egy statikus deployból valódi, forráskód-alapú projektté építettünk újra.

## Stack

- React
- Vite
- TypeScript
- PWA
- Supabase
- React Query
- Dexie

## Helyi fejlesztés

1. Másold a `.env.example` fájlt `.env` névre, ha egyedi env alapértékeket szeretnél.
2. Localhost fejlesztéshez a projekt elsődlegesen a `.env.development.local` fájlt használja a helyi Supabase URL-lel és a publishable key-jel.
3. Telepítsd a függőségeket: `npm install`
4. Indítsd el a helyi Supabase stacket: `npx supabase start`
5. Indítsd el az appot: `npm run dev`
6. Friss backend állapothoz sémafrissítés után futtasd: `npx supabase db reset`

## Kezdő scope

- Profil és onboarding
- Súlynaplózás
- Étkezésnaplózás
- Edzésnaplózás
- Testméretek követése
- Dashboard összegzések

## Supabase

- Konfiguráció: [supabase/config.toml](./supabase/config.toml)
- Kezdő séma: [supabase/migrations/20260318203000_initial_schema.sql](./supabase/migrations/20260318203000_initial_schema.sql)
- Helyi beállítás: [docs/supabase-local-setup.md](./docs/supabase-local-setup.md)
