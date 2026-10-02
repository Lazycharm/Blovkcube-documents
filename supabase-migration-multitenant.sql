-- ============================================================
-- Invoice System — Multi-tenant rebuild (Master Plan P2.3)
-- Run this ONCE, after supabase-setup.sql, in the Supabase SQL Editor.
--
-- Real audit finding (2026-08-01): this app was single-tenant, hardcoded
-- to one client (Blockcube), with fully-open RLS (using(true) with
-- check(true)) on every table — any authenticated request could read or
-- write any row. This migration adds a real tenant model:
--   companies        — the tenant itself (name, address, bank details, logo)
--   company_members  — who belongs to which company, and their role
-- and scopes clients/documents/warranties to a company via company_id,
-- with real RLS checking membership instead of `true`.
-- ============================================================

-- 1. COMPANIES (the tenant)
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  phone text,
  email text,
  website text,
  logo_url text,
  bank_details text,
  trn text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.companies enable row level security;

-- 2. COMPANY MEMBERS (who belongs to which tenant)
create table if not exists public.company_members (
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'member')),
  created_at timestamptz default now(),
  primary key (company_id, user_id)
);

alter table public.company_members enable row level security;

-- Helpers used by the company_members policies below, defined here (before
-- those policies) rather than further down with the rest of the tenant
-- helpers, because CREATE POLICY resolves function references at creation
-- time. NOTE: a policy on company_members must not subquery company_members
-- directly — that re-triggers this same policy on the subquery and causes
-- "infinite recursion detected in policy for relation company_members".
-- Route the lookup through a security-definer function instead, which
-- (owned by the migration role, same owner as the table) bypasses RLS
-- internally and breaks the recursion.
create or replace function public.current_company_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select company_id from public.company_members where user_id = auth.uid() limit 1;
$$;

grant execute on function public.current_company_id() to authenticated;

create or replace function public.is_company_owner(p_company_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.company_members
    where company_id = p_company_id and user_id = auth.uid() and role = 'owner'
  );
$$;

grant execute on function public.is_company_owner(uuid) to authenticated;

-- A member can see the roster of their own company; nothing else.
create policy "Members read their own company roster"
  on public.company_members for select
  using (company_id = public.current_company_id());

-- Only owners can add/remove members.
create policy "Owners manage their company roster"
  on public.company_members for all
  using (public.is_company_owner(company_id))
  with check (public.is_company_owner(company_id));

-- Companies: any member can read their own company's real settings; only
-- owners can update them.
create policy "Members read their own company"
  on public.companies for select
  using (
    exists (
      select 1 from public.company_members cm
      where cm.company_id = companies.id and cm.user_id = auth.uid()
    )
  );

create policy "Owners update their own company"
  on public.companies for update
  using (
    exists (
      select 1 from public.company_members cm
      where cm.company_id = companies.id and cm.user_id = auth.uid() and cm.role = 'owner'
    )
  );

-- 3. REGISTRATION — create a company and join it as owner, atomically.
-- This is the real registration flow: there is no public INSERT policy on
-- companies (a bare insert would let anyone create an orphan company they
-- don't belong to) — the only way to create one is through this function,
-- which creates the company AND the owner membership in one transaction.
create or replace function public.create_company_and_join(
  p_name text,
  p_email text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_company_id uuid;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;
  if p_name is null or length(trim(p_name)) = 0 then
    raise exception 'Company name is required';
  end if;

  insert into public.companies (name, email)
  values (trim(p_name), p_email)
  returning id into v_company_id;

  insert into public.company_members (company_id, user_id, role)
  values (v_company_id, v_uid, 'owner');

  return v_company_id;
end;
$$;

revoke all on function public.create_company_and_join(text, text) from public;
grant execute on function public.create_company_and_join(text, text) to authenticated;

-- 3b. current_company_id() is defined earlier (right after the
-- company_members table, section 2) since the company_members policies
-- need it at creation time. It's also used below as a column DEFAULT so
-- every existing create-a-document/client/warranty call site auto-scopes
-- to the right tenant without having to thread company_id through each one
-- by hand (this app is one-company-per-user for v1, so "first match" via
-- that function is exact, not a guess).

-- 4. SCOPE CLIENTS / DOCUMENTS / WARRANTIES TO A TENANT
alter table public.clients add column if not exists company_id uuid references public.companies(id) on delete cascade default public.current_company_id();
alter table public.documents add column if not exists company_id uuid references public.companies(id) on delete cascade default public.current_company_id();
alter table public.warranties add column if not exists company_id uuid references public.companies(id) on delete cascade default public.current_company_id();

create index if not exists idx_clients_company on public.clients (company_id);
create index if not exists idx_documents_company on public.documents (company_id);
create index if not exists idx_warranties_company on public.warranties (company_id);

-- Drop the real security bug (fully open RLS) and replace with real
-- membership-scoped policies, for all three tables.
drop policy if exists "Allow all access to clients" on public.clients;
create policy "Members access their own company's clients"
  on public.clients for all
  using (exists (select 1 from public.company_members cm where cm.company_id = clients.company_id and cm.user_id = auth.uid()))
  with check (exists (select 1 from public.company_members cm where cm.company_id = clients.company_id and cm.user_id = auth.uid()));

drop policy if exists "Allow all access to documents" on public.documents;
create policy "Members access their own company's documents"
  on public.documents for all
  using (exists (select 1 from public.company_members cm where cm.company_id = documents.company_id and cm.user_id = auth.uid()))
  with check (exists (select 1 from public.company_members cm where cm.company_id = documents.company_id and cm.user_id = auth.uid()));

drop policy if exists "Allow all access to warranties" on public.warranties;
create policy "Members access their own company's warranties"
  on public.warranties for all
  using (exists (select 1 from public.company_members cm where cm.company_id = warranties.company_id and cm.user_id = auth.uid()))
  with check (exists (select 1 from public.company_members cm where cm.company_id = warranties.company_id and cm.user_id = auth.uid()));

-- 5. SUBSCRIPTIONS (Ziina billing, scoped per company)
create table if not exists public.subscriptions (
  company_id uuid primary key references public.companies(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  status text not null default 'active' check (status in ('active', 'past_due', 'canceled')),
  current_period_end timestamptz,
  ziina_intent_id text unique,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.subscriptions enable row level security;

create policy "Members read their own company's subscription"
  on public.subscriptions for select
  using (exists (select 1 from public.company_members cm where cm.company_id = subscriptions.company_id and cm.user_id = auth.uid()));

-- No client insert/update policy on purpose, same reasoning as
-- CashLink/WA Filter/SoftPoint: only the Ziina webhook (service role,
-- only after signature+IP verification) ever activates a plan.

create or replace function public.ensure_free_subscription()
returns trigger as $$
begin
  insert into public.subscriptions (company_id) values (new.id) on conflict (company_id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_company_created on public.companies;
create trigger on_company_created
  after insert on public.companies
  for each row execute function public.ensure_free_subscription();

-- 6. STORAGE — the existing "uploads" bucket policies were also fully
-- open ("allow public uploads/reads" to anyone) — leave read public (logos
-- need to render in generated PDFs without auth), but scope writes to
-- authenticated users only, not the entire internet.
drop policy if exists "Allow public uploads" on storage.objects;
create policy "Authenticated users upload to the uploads bucket"
  on storage.objects for insert
  with check (bucket_id = 'uploads' and auth.role() = 'authenticated');
