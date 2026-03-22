create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);
