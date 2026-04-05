-- ============================================================
-- CoachFlow Database Schema
-- Run this in Supabase SQL Editor (in order)
-- ============================================================

-- 1. PROFILES TABLE
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null unique,
  name text not null,
  role text not null check (role in ('admin', 'manager', 'employee')) default 'employee',
  avatar_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 2. EMPLOYEES TABLE
create table public.employees (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text not null unique,
  department text,
  position text,
  manager_id uuid references public.profiles(id) on delete set null,
  profile_id uuid references public.profiles(id) on delete set null unique,
  is_active boolean default true,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 3. COACHING RECORDS TABLE
create table public.coaching_records (
  id uuid default gen_random_uuid() primary key,
  employee_id uuid references public.employees(id) on delete cascade not null,
  coach_id uuid references public.profiles(id) on delete set null not null,
  coaching_type text not null check (coaching_type in (
    'performance', 'development', 'behavioral', 'goal_setting', 'feedback', 'disciplinary', 'other'
  )),
  notes text not null,
  action_plan text,
  status text not null check (status in ('pending', 'acknowledged')) default 'pending',
  acknowledgment_token uuid default gen_random_uuid() unique not null,
  acknowledged_at timestamptz,
  reminder_sent_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 4. INDEXES
create index idx_coaching_records_employee_id on public.coaching_records(employee_id);
create index idx_coaching_records_coach_id on public.coaching_records(coach_id);
create index idx_coaching_records_status on public.coaching_records(status);
create index idx_coaching_records_created_at on public.coaching_records(created_at desc);
create index idx_employees_manager_id on public.employees(manager_id);
create index idx_coaching_records_token on public.coaching_records(acknowledgment_token);

-- 5. UPDATED_AT TRIGGER FUNCTION
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger employees_updated_at before update on public.employees
  for each row execute function public.handle_updated_at();

create trigger coaching_records_updated_at before update on public.coaching_records
  for each row execute function public.handle_updated_at();

-- 6. AUTO-CREATE PROFILE ON SIGNUP
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 7. HELPER FUNCTION: get current user role
create or replace function public.get_my_role()
returns text as $$
  select role from public.profiles where id = auth.uid();
$$ language sql security definer stable;

-- 8. HELPER FUNCTION: get current user's managed employee ids
create or replace function public.get_my_employee_ids()
returns setof uuid as $$
  select id from public.employees where manager_id = auth.uid();
$$ language sql security definer stable;
