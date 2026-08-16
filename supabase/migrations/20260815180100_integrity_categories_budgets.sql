-- Integridad: categorías únicas, borrar categoría no cascada presupuestos,
-- triggers de kind, flag de seed de categorías por defecto.

-- ---------------------------------------------------------------------------
-- user_settings: no re-sembrar categorías si el usuario las borró todas
-- ---------------------------------------------------------------------------
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  default_categories_seeded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_settings enable row level security;

drop policy if exists "user_settings_crud_own" on public.user_settings;
create policy "user_settings_crud_own" on public.user_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Usuarios que ya tienen categorías: marcar como sembrados
insert into public.user_settings (user_id, default_categories_seeded)
select distinct c.user_id, true
from public.categories c
on conflict (user_id) do update
  set default_categories_seeded = true,
      updated_at = now();

-- ---------------------------------------------------------------------------
-- Unique categorías por (user_id, lower(trim(name)), kind)
-- ---------------------------------------------------------------------------
-- Deduplicar antes del unique: conservar la más antigua por grupo
delete from public.categories c
where exists (
  select 1
  from public.categories keep
  where keep.user_id = c.user_id
    and keep.kind = c.kind
    and lower(trim(keep.name)) = lower(trim(c.name))
    and keep.created_at < c.created_at
);

create unique index if not exists categories_user_name_kind_unique
  on public.categories (user_id, lower(trim(name)), kind);

-- ---------------------------------------------------------------------------
-- budgets.category_id: CASCADE → RESTRICT
-- ---------------------------------------------------------------------------
do $$
declare
  fk_name text;
begin
  select c.conname into fk_name
  from pg_constraint c
  join pg_class t on c.conrelid = t.oid
  join pg_namespace n on t.relnamespace = n.oid
  where n.nspname = 'public'
    and t.relname = 'budgets'
    and c.contype = 'f'
    and pg_get_constraintdef(c.oid) like '%category_id%categories%';

  if fk_name is not null then
    execute format('alter table public.budgets drop constraint %I', fk_name);
  end if;
end $$;

alter table public.budgets
  add constraint budgets_category_id_fkey
  foreign key (category_id) references public.categories (id) on delete restrict;

-- ---------------------------------------------------------------------------
-- Trigger: transactions.kind debe coincidir con categories.kind
-- ---------------------------------------------------------------------------
create or replace function public.enforce_transaction_category_kind()
returns trigger
language plpgsql
as $$
declare
  cat_kind text;
begin
  select kind into cat_kind
  from public.categories
  where id = new.category_id
    and user_id = new.user_id;

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

-- ---------------------------------------------------------------------------
-- Trigger: presupuesto solo sobre categoría de gasto
-- ---------------------------------------------------------------------------
create or replace function public.enforce_budget_expense_category()
returns trigger
language plpgsql
as $$
declare
  cat_kind text;
begin
  select kind into cat_kind
  from public.categories
  where id = new.category_id
    and user_id = new.user_id;

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

-- ---------------------------------------------------------------------------
-- Trigger: no cambiar kind de categoría si hay movimientos o presupuestos
-- ---------------------------------------------------------------------------
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
