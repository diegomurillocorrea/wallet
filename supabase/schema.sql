-- Ejecutar en Supabase SQL Editor si aún no tenés estas tablas.
-- Ajustá nombres si tu esquema ya existe con otra convención.

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('expense', 'income')),
  color text not null default '#6366f1',
  icon text not null default 'Circle',
  -- reservado; la app ya no distingue categorías de sistema (siempre false)
  is_system boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists categories_user_id_idx on public.categories (user_id);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete restrict,
  amount numeric(14, 2) not null check (amount > 0),
  kind text not null check (kind in ('expense', 'income')),
  note text,
  occurred_at date not null default ((now() at time zone 'utc')::date),
  created_at timestamptz not null default now()
);

create index if not exists transactions_user_occurred_idx
  on public.transactions (user_id, occurred_at desc);

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  amount_limit numeric(14, 2) not null check (amount_limit > 0),
  month_start date not null,
  unique (user_id, category_id, month_start)
);

create index if not exists budgets_user_month_idx on public.budgets (user_id, month_start);

alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;

drop policy if exists "categories_crud_own" on public.categories;
create policy "categories_crud_own" on public.categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "transactions_crud_own" on public.transactions;
create policy "transactions_crud_own" on public.transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "budgets_crud_own" on public.budgets;
create policy "budgets_crud_own" on public.budgets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
