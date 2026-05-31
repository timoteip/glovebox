-- ============================================================
-- Glovebox — Supabase schema
-- Run this in the Supabase SQL editor (one time).
-- Auth (Google + email/password) is configured in the Supabase
-- dashboard under Authentication > Providers, not here.
-- ============================================================

-- ---------- VEHICLES ----------
create table public.vehicles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  year        int,
  make        text not null,
  model       text not null,
  nickname    text,
  vin         text,
  created_at  timestamptz not null default now()
);

-- ---------- ENTRIES ----------
create table public.entries (
  id           uuid primary key default gen_random_uuid(),
  vehicle_id   uuid not null references public.vehicles (id) on delete cascade,
  type         text not null check (type in ('service','part','fuel','mileage','note')),
  date         date not null,
  odometer     int,
  title        text not null,
  description  text,
  cost         numeric(10,2),     -- nullable
  gallons      numeric(6,3),      -- nullable, fuel only
  is_full_tank boolean,           -- nullable, fuel only
  fuel_grade   text,              -- nullable, fuel only
  created_at   timestamptz not null default now()
);

-- ---------- REMINDERS ----------
create table public.reminders (
  id          uuid primary key default gen_random_uuid(),
  vehicle_id  uuid not null references public.vehicles (id) on delete cascade,
  name        text not null,
  due_miles   int,
  due_date    date,
  created_at  timestamptz not null default now()
);

-- ---------- INDEXES ----------
-- Timeline query: entries for a vehicle, newest first.
create index entries_vehicle_date_idx on public.entries (vehicle_id, date desc);
-- MPG calc: full-tank fuel entries for a vehicle, ordered by odometer.
create index entries_fuel_mpg_idx on public.entries (vehicle_id, odometer)
  where type = 'fuel' and is_full_tank = true;
create index vehicles_user_idx on public.vehicles (user_id);

-- ============================================================
-- ROW-LEVEL SECURITY
-- Each user can only see/write their own vehicles, and only
-- entries belonging to vehicles they own.
-- ============================================================

alter table public.vehicles  enable row level security;
alter table public.entries   enable row level security;
alter table public.reminders enable row level security;

-- ---------- VEHICLES policies ----------
create policy "vehicles_select_own" on public.vehicles
  for select using (user_id = auth.uid());

create policy "vehicles_insert_own" on public.vehicles
  for insert with check (user_id = auth.uid());

create policy "vehicles_update_own" on public.vehicles
  for update using (user_id = auth.uid())
              with check (user_id = auth.uid());

create policy "vehicles_delete_own" on public.vehicles
  for delete using (user_id = auth.uid());

-- ---------- ENTRIES policies ----------
-- An entry is yours if its vehicle is yours.
create policy "entries_select_own" on public.entries
  for select using (
    exists (
      select 1 from public.vehicles v
      where v.id = entries.vehicle_id and v.user_id = auth.uid()
    )
  );

create policy "entries_insert_own" on public.entries
  for insert with check (
    exists (
      select 1 from public.vehicles v
      where v.id = entries.vehicle_id and v.user_id = auth.uid()
    )
  );

create policy "entries_update_own" on public.entries
  for update using (
    exists (
      select 1 from public.vehicles v
      where v.id = entries.vehicle_id and v.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.vehicles v
      where v.id = entries.vehicle_id and v.user_id = auth.uid()
    )
  );

create policy "entries_delete_own" on public.entries
  for delete using (
    exists (
      select 1 from public.vehicles v
      where v.id = entries.vehicle_id and v.user_id = auth.uid()
    )
  );

-- ---------- REMINDERS policies ----------
create policy "reminders_select_own" on public.reminders
  for select using (
    exists (
      select 1 from public.vehicles v
      where v.id = reminders.vehicle_id and v.user_id = auth.uid()
    )
  );

create policy "reminders_insert_own" on public.reminders
  for insert with check (
    exists (
      select 1 from public.vehicles v
      where v.id = reminders.vehicle_id and v.user_id = auth.uid()
    )
  );

create policy "reminders_delete_own" on public.reminders
  for delete using (
    exists (
      select 1 from public.vehicles v
      where v.id = reminders.vehicle_id and v.user_id = auth.uid()
    )
  );

-- ---------- USER PREFERENCES ----------
create table public.user_preferences (
  user_id            uuid primary key references auth.users (id) on delete cascade,
  default_vehicle_id uuid references public.vehicles (id) on delete set null
);

alter table public.user_preferences enable row level security;

create policy "prefs_select_own" on public.user_preferences
  for select using (user_id = auth.uid());

create policy "prefs_insert_own" on public.user_preferences
  for insert with check (user_id = auth.uid());

create policy "prefs_update_own" on public.user_preferences
  for update using (user_id = auth.uid())
               with check (user_id = auth.uid());

-- ---------- MIGRATIONS (run after initial setup) ----------
-- alter table public.entries add column fuel_grade text;
-- (run the create table blocks for reminders and user_preferences as migrations)
