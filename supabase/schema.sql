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
--
-- Para bases ya existentes, preferí las migraciones en supabase/migrations/.

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

create unique index if not exists categories_user_name_kind_unique
  on public.categories (user_id, lower(trim(name)), kind);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete restrict,
  amount numeric(14, 2) not null check (amount > 0),
  kind text not null check (kind in ('expense', 'income')),
  note text,
  occurred_at date not null default ((now() at time zone 'America/El_Salvador')::date),
  created_at timestamptz not null default now()
);

create index if not exists transactions_user_occurred_idx
  on public.transactions (user_id, occurred_at desc);

create table if not exists public.credit_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  bin text not null check (char_length(bin) = 6 and bin ~ '^[0-9]{6}$'),
  last4 text not null check (char_length(last4) = 4 and last4 ~ '^[0-9]{4}$'),
  holder_first_name text not null,
  holder_last_name text not null,
  exp_month smallint not null check (exp_month >= 1 and exp_month <= 12),
  exp_year smallint not null check (exp_year >= 2000 and exp_year <= 2100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists credit_cards_user_id_idx on public.credit_cards (user_id);

create unique index if not exists credit_cards_user_bin_last4_unique
  on public.credit_cards (user_id, bin, last4);

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete restrict,
  credit_card_id uuid references public.credit_cards (id) on delete set null,
  payment_day smallint not null default 1 check (payment_day >= 1 and payment_day <= 31),
  unique (user_id, category_id)
);

create index if not exists budgets_credit_card_id_idx on public.budgets (credit_card_id);

create table if not exists public.budget_limits (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid not null references public.budgets (id) on delete cascade,
  month_start date not null,
  amount_limit numeric(14, 2) not null check (amount_limit > 0),
  created_at timestamptz not null default now(),
  unique (budget_id, month_start)
);

create index if not exists budget_limits_budget_month_idx
  on public.budget_limits (budget_id, month_start desc);

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  default_categories_seeded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.credit_cards enable row level security;
alter table public.budgets enable row level security;
alter table public.budget_limits enable row level security;
alter table public.user_settings enable row level security;

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

drop policy if exists "budget_limits_crud_own" on public.budget_limits;
create policy "budget_limits_crud_own" on public.budget_limits
  for all
  using (
    exists (
      select 1 from public.budgets b
      where b.id = budget_limits.budget_id and b.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.budgets b
      where b.id = budget_limits.budget_id and b.user_id = auth.uid()
    )
  );

drop policy if exists "user_settings_crud_own" on public.user_settings;
create policy "user_settings_crud_own" on public.user_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Triggers de integridad (también en migraciones)
create or replace function public.enforce_transaction_category_kind()
returns trigger
language plpgsql
as $$
declare
  cat_kind text;
begin
  select kind into cat_kind
  from public.categories
  where id = new.category_id and user_id = new.user_id;
  if cat_kind is null then
    raise exception 'La categoría no existe o no pertenece al usuario';
  end if;
  if cat_kind <> new.kind then
    raise exception 'El tipo del movimiento debe coincidir con el tipo de la categoría';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_transactions_category_kind on public.transactions;
create trigger trg_transactions_category_kind
  before insert or update of category_id, kind, user_id
  on public.transactions
  for each row
  execute function public.enforce_transaction_category_kind();

create or replace function public.enforce_budget_expense_category()
returns trigger
language plpgsql
as $$
declare
  cat_kind text;
begin
  select kind into cat_kind
  from public.categories
  where id = new.category_id and user_id = new.user_id;
  if cat_kind is null then
    raise exception 'La categoría no existe o no pertenece al usuario';
  end if;
  if cat_kind <> 'expense' then
    raise exception 'Solo categorías de gasto pueden tener presupuesto';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_budgets_expense_category on public.budgets;
create trigger trg_budgets_expense_category
  before insert or update of category_id, user_id
  on public.budgets
  for each row
  execute function public.enforce_budget_expense_category();

create or replace function public.enforce_category_kind_immutable_when_used()
returns trigger
language plpgsql
as $$
begin
  if new.kind is distinct from old.kind then
    if exists (select 1 from public.transactions t where t.category_id = old.id) then
      raise exception 'No se puede cambiar el tipo: hay movimientos con esta categoría';
    end if;
    if exists (select 1 from public.budgets b where b.category_id = old.id) then
      raise exception 'No se puede cambiar el tipo: hay un presupuesto con esta categoría';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_categories_kind_immutable on public.categories;
create trigger trg_categories_kind_immutable
  before update of kind
  on public.categories
  for each row
  execute function public.enforce_category_kind_immutable_when_used();
