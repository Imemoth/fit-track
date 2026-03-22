insert into public.food_catalog_items (
  id,
  owner_user_id,
  name,
  brand,
  serving_size_text,
  calories,
  protein_g,
  carbs_g,
  fat_g,
  source,
  external_ref
)
values
  (
    '4f54db18-d831-49f3-bc85-6a147144f6fa',
    null,
    'Chicken Breast',
    'Generic',
    '100 g',
    165,
    31,
    0,
    3.6,
    'seed',
    'seed:chicken-breast-100g'
  ),
  (
    'ff8fb278-82b1-4d59-a92d-e042cfcc2b35',
    null,
    'Cooked Rice',
    'Generic',
    '100 g',
    130,
    2.7,
    28.2,
    0.3,
    'seed',
    'seed:cooked-rice-100g'
  ),
  (
    'be366dd7-d4dc-4eda-90ad-f1108be5a8ab',
    null,
    'Greek Yogurt',
    'Generic',
    '170 g',
    100,
    17,
    6,
    0,
    'seed',
    'seed:greek-yogurt-170g'
  ),
  (
    '65c46ed1-dd08-4e4f-9f7f-8296d02d6d7b',
    null,
    'Banana',
    'Generic',
    '1 medium',
    105,
    1.3,
    27,
    0.3,
    'seed',
    'seed:banana-medium'
  ),
  (
    '2a35460d-2f16-4019-9972-a0c52fa1b531',
    null,
    'Eggs',
    'Generic',
    '2 large',
    144,
    12.6,
    0.8,
    9.6,
    'seed',
    'seed:eggs-2-large'
  )
on conflict (id) do update
set
  owner_user_id = excluded.owner_user_id,
  name = excluded.name,
  brand = excluded.brand,
  serving_size_text = excluded.serving_size_text,
  calories = excluded.calories,
  protein_g = excluded.protein_g,
  carbs_g = excluded.carbs_g,
  fat_g = excluded.fat_g,
  source = excluded.source,
  external_ref = excluded.external_ref,
  updated_at = now();

insert into public.workout_plan_templates (
  id,
  owner_user_id,
  name,
  description,
  is_public
)
values
  (
    '8102d470-c964-4f50-9d06-0dab0633d5c4',
    null,
    'Full Body Starter',
    'Three-day full body starter template focused on basic compound lifts.',
    true
  ),
  (
    '0de9da5a-c0fa-47cd-b14d-07e3586dbcb9',
    null,
    'Upper Lower Split',
    'Four-day split template alternating upper and lower sessions.',
    true
  )
on conflict (id) do update
set
  owner_user_id = excluded.owner_user_id,
  name = excluded.name,
  description = excluded.description,
  is_public = excluded.is_public,
  updated_at = now();

delete from public.workout_plan_template_exercises
where template_id in (
  '8102d470-c964-4f50-9d06-0dab0633d5c4',
  '0de9da5a-c0fa-47cd-b14d-07e3586dbcb9'
);

insert into public.workout_plan_template_exercises (
  id,
  template_id,
  exercise_name,
  sort_order,
  target_sets
)
values
  (
    '81bdf500-5df5-4e4d-b29f-59ffcfbc3141',
    '8102d470-c964-4f50-9d06-0dab0633d5c4',
    'Goblet Squat',
    0,
    '[{"reps":"8-10","restSeconds":90},{"reps":"8-10","restSeconds":90},{"reps":"8-10","restSeconds":90}]'::jsonb
  ),
  (
    'ec8d5974-a454-48a7-bc80-e09bf7062b7a',
    '8102d470-c964-4f50-9d06-0dab0633d5c4',
    'Dumbbell Bench Press',
    1,
    '[{"reps":"8-10","restSeconds":90},{"reps":"8-10","restSeconds":90},{"reps":"8-10","restSeconds":90}]'::jsonb
  ),
  (
    'e34646aa-6600-4e8b-b62d-8fba1b92f218',
    '8102d470-c964-4f50-9d06-0dab0633d5c4',
    'Lat Pulldown',
    2,
    '[{"reps":"10-12","restSeconds":75},{"reps":"10-12","restSeconds":75},{"reps":"10-12","restSeconds":75}]'::jsonb
  ),
  (
    '9c047f4f-cddc-4297-8422-23d4385211f9',
    '0de9da5a-c0fa-47cd-b14d-07e3586dbcb9',
    'Back Squat',
    0,
    '[{"reps":"5","restSeconds":120},{"reps":"5","restSeconds":120},{"reps":"5","restSeconds":120}]'::jsonb
  ),
  (
    '1d361659-d651-4164-8a15-82d9e44956ca',
    '0de9da5a-c0fa-47cd-b14d-07e3586dbcb9',
    'Romanian Deadlift',
    1,
    '[{"reps":"8","restSeconds":120},{"reps":"8","restSeconds":120},{"reps":"8","restSeconds":120}]'::jsonb
  ),
  (
    '4b199c01-d118-4510-9c26-06cb906039e3',
    '0de9da5a-c0fa-47cd-b14d-07e3586dbcb9',
    'Pull-Up or Assisted Pull-Up',
    2,
    '[{"reps":"6-8","restSeconds":90},{"reps":"6-8","restSeconds":90},{"reps":"6-8","restSeconds":90}]'::jsonb
  );
