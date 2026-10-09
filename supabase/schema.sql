-- Run this in Supabase SQL Editor.
-- This creates the minimum schema needed for the construction management app.

create extension if not exists pgcrypto;

create table if not exists public.agencies (
  id uuid primary key default gen_random_uuid(),
  project_id text not null default 'project-1',
  name text not null,
  work_category text not null default 'General work',
  contact_person text not null default '',
  phone text not null default '',
  email text,
  address text,
  notes text,
  status text not null default 'planned' check (status in ('planned', 'active', 'completed', 'inactive')),
  start_date date,
  expected_completion_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  agency_name text,
  contract_number text not null,
  title text not null,
  description text,
  amount numeric(12,2) not null default 0,
  advance_amount numeric(12,2) not null default 0,
  retention_amount numeric(12,2) not null default 0,
  agreed_start_date date,
  expected_completion_date date,
  scope_of_work text,
  terms_and_conditions text,
  status text not null default 'draft' check (status in ('draft', 'active', 'completed', 'cancelled', 'on_hold')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.milestones (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  contract_id uuid references public.contracts(id) on delete set null,
  name text not null,
  description text,
  sequence_no integer not null default 1,
  planned_start_date date,
  due_date date,
  agreed_amount numeric(12,2) not null default 0,
  completion_percentage numeric(5,2) not null default 0,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'submitted_for_approval', 'approved', 'rejected', 'completed')),
  actual_completion_date date,
  completion_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  contract_id uuid references public.contracts(id) on delete set null,
  milestone_id uuid references public.milestones(id) on delete set null,
  payment_reference text not null,
  amount numeric(12,2) not null default 0,
  payment_date date not null default current_date,
  payment_method text not null default 'bank_transfer' check (payment_method in ('bank_transfer', 'upi', 'cash', 'cheque', 'other')),
  transaction_reference text,
  status text not null default 'pending' check (status in ('planned', 'pending', 'paid', 'cancelled')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.progress_entries (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid references public.agencies(id) on delete set null,
  title text not null,
  description text,
  date date not null default current_date,
  status text not null default 'in_progress' check (status in ('planned', 'in_progress', 'completed', 'issue')),
  progress_percent numeric(5,2) not null default 0,
  attachments text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid references public.agencies(id) on delete set null,
  title text not null,
  category text not null default 'misc' check (category in ('labour', 'materials', 'equipment', 'permit', 'misc')),
  amount numeric(12,2) not null default 0,
  expense_date date not null default current_date,
  status text not null default 'approved' check (status in ('planned', 'approved', 'paid', 'rejected')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  agency_id uuid references public.agencies(id) on delete set null,
  title text not null,
  document_type text not null default 'photo',
  file_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at_agencies
before update on public.agencies
for each row execute function public.set_updated_at();

create trigger set_updated_at_contracts
before update on public.contracts
for each row execute function public.set_updated_at();

create trigger set_updated_at_milestones
before update on public.milestones
for each row execute function public.set_updated_at();

create trigger set_updated_at_payments
before update on public.payments
for each row execute function public.set_updated_at();

create trigger set_updated_at_progress_entries
before update on public.progress_entries
for each row execute function public.set_updated_at();

create trigger set_updated_at_expenses
before update on public.expenses
for each row execute function public.set_updated_at();

create trigger set_updated_at_documents
before update on public.documents
for each row execute function public.set_updated_at();

create trigger set_updated_at_project_settings
before update on public.project_settings
for each row execute function public.set_updated_at();

alter table public.agencies enable row level security;
alter table public.contracts enable row level security;
alter table public.milestones enable row level security;
alter table public.payments enable row level security;
alter table public.progress_entries enable row level security;
alter table public.expenses enable row level security;
alter table public.documents enable row level security;
alter table public.project_settings enable row level security;

create policy "Authenticated users can view all agencies" on public.agencies
  for select to authenticated using (true);
create policy "Authenticated users can insert agencies" on public.agencies
  for insert to authenticated with check (true);
create policy "Authenticated users can update agencies" on public.agencies
  for update to authenticated using (true) with check (true);
create policy "Authenticated users can delete agencies" on public.agencies
  for delete to authenticated using (true);

create policy "Authenticated users can view all contracts" on public.contracts
  for select to authenticated using (true);
create policy "Authenticated users can insert contracts" on public.contracts
  for insert to authenticated with check (true);
create policy "Authenticated users can update contracts" on public.contracts
  for update to authenticated using (true) with check (true);
create policy "Authenticated users can delete contracts" on public.contracts
  for delete to authenticated using (true);

create policy "Authenticated users can view all milestones" on public.milestones
  for select to authenticated using (true);
create policy "Authenticated users can insert milestones" on public.milestones
  for insert to authenticated with check (true);
create policy "Authenticated users can update milestones" on public.milestones
  for update to authenticated using (true) with check (true);
create policy "Authenticated users can delete milestones" on public.milestones
  for delete to authenticated using (true);

create policy "Authenticated users can view all payments" on public.payments
  for select to authenticated using (true);
create policy "Authenticated users can insert payments" on public.payments
  for insert to authenticated with check (true);
create policy "Authenticated users can update payments" on public.payments
  for update to authenticated using (true) with check (true);
create policy "Authenticated users can delete payments" on public.payments
  for delete to authenticated using (true);

create policy "Authenticated users can view all progress" on public.progress_entries
  for select to authenticated using (true);
create policy "Authenticated users can insert progress" on public.progress_entries
  for insert to authenticated with check (true);
create policy "Authenticated users can update progress" on public.progress_entries
  for update to authenticated using (true) with check (true);
create policy "Authenticated users can delete progress" on public.progress_entries
  for delete to authenticated using (true);

create policy "Authenticated users can view all expenses" on public.expenses
  for select to authenticated using (true);
create policy "Authenticated users can insert expenses" on public.expenses
  for insert to authenticated with check (true);
create policy "Authenticated users can update expenses" on public.expenses
  for update to authenticated using (true) with check (true);
create policy "Authenticated users can delete expenses" on public.expenses
  for delete to authenticated using (true);

create policy "Authenticated users can view their own documents" on public.documents
  for select to authenticated using (auth.uid() = user_id);
create policy "Authenticated users can insert their own documents" on public.documents
  for insert to authenticated with check (auth.uid() = user_id);
create policy "Authenticated users can update their own documents" on public.documents
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Authenticated users can delete their own documents" on public.documents
  for delete to authenticated using (auth.uid() = user_id);

create policy "Authenticated users can view settings" on public.project_settings
  for select to authenticated using (true);
create policy "Authenticated users can insert settings" on public.project_settings
  for insert to authenticated with check (true);
create policy "Authenticated users can update settings" on public.project_settings
  for update to authenticated using (true) with check (true);
create policy "Authenticated users can delete settings" on public.project_settings
  for delete to authenticated using (true);

create index if not exists idx_agencies_status on public.agencies(status);
create index if not exists idx_agencies_project_id on public.agencies(project_id);
create index if not exists idx_contracts_agency_id on public.contracts(agency_id);
create index if not exists idx_contracts_status on public.contracts(status);
create index if not exists idx_milestones_agency_id on public.milestones(agency_id);
create index if not exists idx_milestones_contract_id on public.milestones(contract_id);
create index if not exists idx_payments_agency_id on public.payments(agency_id);
create index if not exists idx_payments_status on public.payments(status);
create index if not exists idx_progress_entries_date on public.progress_entries(date);
create index if not exists idx_expenses_agency_id on public.expenses(agency_id);
create index if not exists idx_documents_agency_id on public.documents(agency_id);
