-- ============================================================
-- CoachFlow Row Level Security Policies
-- Run AFTER schema.sql
-- ============================================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.employees enable row level security;
alter table public.coaching_records enable row level security;

-- ============================================================
-- PROFILES POLICIES
-- ============================================================

-- Users can read their own profile
create policy "profiles: users read own"
  on public.profiles for select
  using (auth.uid() = id);

-- Managers can read profiles of their employees
create policy "profiles: managers read employee profiles"
  on public.profiles for select
  using (
    public.get_my_role() = 'manager'
    and id in (
      select profile_id from public.employees
      where manager_id = auth.uid() and profile_id is not null
    )
  );

-- Admins can read all profiles
create policy "profiles: admins read all"
  on public.profiles for select
  using (public.get_my_role() = 'admin');

-- Users can update their own profile (not role)
create policy "profiles: users update own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id and role = (select role from public.profiles where id = auth.uid()));

-- Admins can update any profile (including role)
create policy "profiles: admins update all"
  on public.profiles for update
  using (public.get_my_role() = 'admin');

-- ============================================================
-- EMPLOYEES POLICIES
-- ============================================================

-- Managers can read their own employees
create policy "employees: managers read own"
  on public.employees for select
  using (
    manager_id = auth.uid()
    or public.get_my_role() = 'admin'
  );

-- Employees can read their own record
create policy "employees: read own record"
  on public.employees for select
  using (profile_id = auth.uid());

-- Managers can insert employees
create policy "employees: managers insert"
  on public.employees for insert
  with check (
    public.get_my_role() in ('manager', 'admin')
    and (manager_id = auth.uid() or public.get_my_role() = 'admin')
  );

-- Managers can update their employees; admins update all
create policy "employees: managers update own"
  on public.employees for update
  using (
    manager_id = auth.uid()
    or public.get_my_role() = 'admin'
  );

-- Only admins can delete employees
create policy "employees: admins delete"
  on public.employees for delete
  using (public.get_my_role() = 'admin');

-- ============================================================
-- COACHING RECORDS POLICIES
-- ============================================================

-- Employees see only their own records
create policy "coaching: employees read own"
  on public.coaching_records for select
  using (
    employee_id in (
      select id from public.employees where profile_id = auth.uid()
    )
  );

-- Managers see records for their employees
create policy "coaching: managers read own employees"
  on public.coaching_records for select
  using (
    coach_id = auth.uid()
    or employee_id in (
      select id from public.employees where manager_id = auth.uid()
    )
  );

-- Admins see everything
create policy "coaching: admins read all"
  on public.coaching_records for select
  using (public.get_my_role() = 'admin');

-- Managers can create coaching records for their employees
create policy "coaching: managers insert"
  on public.coaching_records for insert
  with check (
    public.get_my_role() in ('manager', 'admin')
    and (
      coach_id = auth.uid()
      or public.get_my_role() = 'admin'
    )
  );

-- Managers can update their own records; admins update all
create policy "coaching: managers update own"
  on public.coaching_records for update
  using (
    coach_id = auth.uid()
    or public.get_my_role() = 'admin'
  );

-- Only admins can delete records
create policy "coaching: admins delete"
  on public.coaching_records for delete
  using (public.get_my_role() = 'admin');

-- ============================================================
-- SERVICE ROLE BYPASS (for Edge Functions)
-- The service role key bypasses RLS by default in Supabase.
-- No extra policy needed — just use service role in Edge Functions.
-- ============================================================
