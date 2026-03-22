# Supabase Local Setup

Ez a projekt a Supabase futásidejű konfigurációját és sémáját a `supabase/` mappában tartja.

## Mi hol található

- `supabase/config.toml`: helyi Supabase futásidejű konfiguráció.
- `supabase/migrations/20260318203000_initial_schema.sql`: séma, triggerek és RLS policyk.
- `supabase/seed.sql`: kezdő publikus ételkatalógus-elemek és edzéstervsablonok.
- `.env.example`: frontend env változók a Supabase kliens eléréséhez.

## Helyi bootstrap

1. Telepítsd a függőségeket:

```bash
npm.cmd install
```

2. Indítsd el a helyi Supabase-et:

```bash
npm.cmd run supabase:start
```

3. Ellenőrizd a helyi endpointokat és kulcsokat:

```bash
npm.cmd run supabase:status
```

4. Helyi fejlesztéshez elsődlegesen a `.env.development.local` fájlt használd. A projekt már támogatja:

- `VITE_SUPABASE_URL=http://127.0.0.1:54321`
- `VITE_SUPABASE_PUBLISHABLE_KEY=<local publishable key from supabase status>`

Ha kézzel szeretnéd felülírni, másold az értékeket a `.env` vagy `.env.development.local` fájlba:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_ANON_KEY`

5. Indítsd el az appot:

```bash
npm.cmd run dev
```

Ha a dev szerver már futott, amikor az env fájlok változtak, indítsd újra, hogy a Vite betöltse az új értékeket.

## Adatbázis reset / reprodukálhatóság

Helyi adatbázis reset és az összes migráció újrafuttatása:

```bash
npm.cmd run supabase:db:reset
```

A beállított seed script reset után automatikusan lefut, hacsak nem használod a `--no-seed` kapcsolót.

Migrációk alkalmazása egy futó helyi stackre:

```bash
npm.cmd run supabase:db:push
```

Migrációk és a beállított seed adatok pusholása egy linkelt remote projektbe csak akkor történjen, ha a driftet már átnézted:

```bash
npm.cmd exec -- supabase db push --linked --include-seed
```

## Megjegyzések

- Az auth redirect támogatja a `http://localhost:5173` és a `http://127.0.0.1:5173` címet is.
- Hosted projektnél elsődlegesen a `VITE_SUPABASE_PUBLISHABLE_KEY` ajánlott; a `VITE_SUPABASE_ANON_KEY` kompatibilis fallbackként megmarad.
- A repo seed szándékosan kicsi és publikus használatra biztonságos. Kezdő katalógus- és sablonadatokat ad, nem licencelt tápértékadatbázist.
- Minden új táblához tartozzon migráció és RLS policy, mielőtt a frontend használni kezdi.
