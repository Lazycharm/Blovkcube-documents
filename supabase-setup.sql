-- ============================================================
-- Blockcube Document Builder — Supabase Setup
-- Run this ONCE in Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)
-- ============================================================

-- 1. CLIENTS TABLE
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text,
  address text,
  phone text,
  email text,
  trn text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.clients enable row level security;

create policy "Allow all access to clients"
  on public.clients for all
  using (true)
  with check (true);

-- 2. DOCUMENTS TABLE
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'invoice',
  document_number text,
  status text default 'draft',
  issue_date date,
  due_date date,
  payment_date date,
  payment_method text,
  currency text default 'AED',
  client_name text,
  client_company text,
  client_address text,
  client_phone text,
  client_email text,
  client_trn text,
  items jsonb default '[]'::jsonb,
  subtotal numeric default 0,
  total_discount numeric default 0,
  total_tax numeric default 0,
  grand_total numeric default 0,
  notes text,
  payment_terms text,
  bank_details text,
  company_name text,
  company_address text,
  company_phone text,
  company_email text,
  company_website text,
  company_logo_url text,
  stamp_url text,
  signature_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.documents enable row level security;

create policy "Allow all access to documents"
  on public.documents for all
  using (true)
  with check (true);

-- 3. WARRANTIES TABLE
create table if not exists public.warranties (
  id uuid primary key default gen_random_uuid(),
  certificate_number text,
  status text default 'active',
  issue_date date,
  expiry_date date,
  warranty_duration integer default 12,
  warranty_duration_unit text default 'months',
  product_name text,
  product_model text,
  product_serial text,
  product_description text,
  product_image_url text,
  client_name text,
  client_company text,
  client_address text,
  client_phone text,
  client_email text,
  client_trn text,
  company_name text,
  company_address text,
  company_phone text,
  company_email text,
  company_website text,
  company_logo_url text,
  terms text,
  coverage text,
  exclusions text,
  stamp_url text,
  signature_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.warranties enable row level security;

create policy "Allow all access to warranties"
  on public.warranties for all
  using (true)
  with check (true);

-- 4. AUTO-UPDATE updated_at TRIGGER
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger clients_updated_at
  before update on public.clients
  for each row execute function public.handle_updated_at();

create trigger documents_updated_at
  before update on public.documents
  for each row execute function public.handle_updated_at();

create trigger warranties_updated_at
  before update on public.warranties
  for each row execute function public.handle_updated_at();

-- 5. STORAGE BUCKET
-- Create a public bucket called "uploads" for logos, stamps, signatures, product images
insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do nothing;

-- Allow anyone to upload files to the uploads bucket
create policy "Allow public uploads"
  on storage.objects for insert
  with check (bucket_id = 'uploads');

-- Allow anyone to read files from the uploads bucket
create policy "Allow public reads"
  on storage.objects for select
  using (bucket_id = 'uploads');
