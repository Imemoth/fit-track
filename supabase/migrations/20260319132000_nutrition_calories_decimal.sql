alter table public.nutrition_entries
  alter column calories type numeric(8,2)
  using calories::numeric(8,2);
