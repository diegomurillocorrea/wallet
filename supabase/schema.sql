-- Ejecutar en Supabase SQL Editor si aún no tenés estas tablas.
-- Ajustá nombres si tu esquema ya existe con otra convención.
--
-- Auth (Google): en el dashboard de Supabase → Authentication → Providers,
-- habilitá Google, cargá Client ID / Secret de Google Cloud Console, y en
-- URL Configuration agregá la URL de callback:
--   https://<tu-proyecto>.supabase.co/auth/v1/callback
-- En "Redirect URLs" de la app incluí:
--   http://localhost:3000/auth/callback
--   https://<tu-dominio-producción>/auth/callback

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

create table if not exists public.credit_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  pan text not null check (char_length(pan) = 16 and pan ~ '^[0-9]{16}$'),
  holder_first_name text not null,
  holder_last_name text not null,
  exp_month smallint not null check (exp_month >= 1 and exp_month <= 12),
  exp_year smallint not null check (exp_year >= 2000 and exp_year <= 2100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists credit_cards_user_id_idx on public.credit_cards (user_id);

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  credit_card_id uuid references public.credit_cards (id) on delete set null,
  amount_limit numeric(14, 2) not null check (amount_limit > 0),
  month_start date not null,
  payment_day smallint not null default 1 check (payment_day >= 1 and payment_day <= 31),
  unique (user_id, category_id)
);

create index if not exists budgets_user_month_idx on public.budgets (user_id, month_start);

create index if not exists budgets_credit_card_id_idx on public.budgets (credit_card_id);

alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.credit_cards enable row level security;
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

drop policy if exists "credit_cards_crud_own" on public.credit_cards;
create policy "credit_cards_crud_own" on public.credit_cards
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
