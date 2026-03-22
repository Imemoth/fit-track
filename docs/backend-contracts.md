# Backend Contracts

The first frontend-facing backend contract layer lives under `src/lib/api/`.

## Current Scope

- `src/lib/api/auth`: session and user contract, auth actions, auth state subscription wrapper
- `src/lib/api/profile`: frontend-friendly profile contract plus read/write operations for the signed-in user
- `src/lib/api/weight`: frontend-friendly weight entry contract and CRUD for the signed-in user
- `src/lib/api/nutrition`: frontend-friendly nutrition entry contract and CRUD for the signed-in user
- `src/lib/api/workouts`: frontend-friendly workout session contract with nested exercises and CRUD for the signed-in user
- `src/lib/api/measurements`: frontend-friendly body measurement contract and CRUD for the signed-in user
- `src/lib/api/food-catalog`: food catalog and nutrition link read contracts
- `src/lib/api/workout-templates`: workout plan template read contracts
- `src/lib/api/import-export-jobs`: import/export job status read contracts
- `src/lib/api/index.ts`: stable barrel for frontend imports

## Rule

Frontend auth, profile, weight, nutrition, workouts, measurements, food catalog, workout template, and import/export code should import from `src/lib/api` instead of talking to `src/lib/supabase/client` directly.

## Notes

- Contracts are intentionally small and frontend-oriented.
- Database column naming stays behind the API layer. The frontend consumes camelCase profile fields.
- Weight entry contracts also hide `weight_entries` snake_case columns behind camelCase API types.
- Nutrition entry contracts also hide `nutrition_entries` snake_case columns behind camelCase API types.
- Workout contracts hide both `workout_sessions` and `workout_exercises` snake_case tables behind a nested camelCase API shape.
- Measurement contracts hide `body_measurements` snake_case columns behind camelCase API types.
- Food catalog contracts hide `food_catalog_items` and `nutrition_entry_food_links` behind frontend-friendly read models.
- Workout template contracts hide `workout_plan_templates` and `workout_plan_template_exercises` behind nested camelCase read models.
- Import/export contracts hide `import_export_jobs` behind a frontend-friendly job status model.
- If Supabase env is missing, or the configured backend is temporarily unreachable, the contract layer falls back to demo/local mode inside `src/lib/api`.
- Demo/local mode keeps auth state and the app-facing contract surface available in browser storage, returning empty placeholder collections for catalog/template/job areas until real backend data exists.
- Food catalog and workout templates now ship with a tiny public-safe starter seed. It is suitable for local/demo validation, not as a replacement for a licensed food database or a production content pipeline.
- Local validation path: `npm.cmd run supabase:db:reset` then inspect catalog/template reads through the API layer.
- Hosted validation path: verify remote drift first, then use `npm.cmd exec -- supabase db push --linked --include-seed` only when the linked project is confirmed safe to update.
- If a new backend-facing area is added, extend `src/lib/api/` first and keep Supabase-specific mapping inside that layer.
