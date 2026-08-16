-- Límites de presupuesto versionados por mes.
-- budgets queda como definición (categoría, día de pago, tarjeta).
-- budget_limits guarda amount_limit por (budget_id, month_start).

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

comment on table public.budget_limits is
  'Límite de gasto por mes. Si no hay fila para un mes, se hereda la última versión con month_start <= ese mes.';

comment on column public.budget_limits.month_start is
  'Primer día del mes (YYYY-MM-01) al que aplica este límite.';

-- Sembrar una versión ancla (2000-01-01) con el amount_limit actual
-- para que meses históricos sigan resolviendo un límite.
insert into public.budget_limits (budget_id, month_start, amount_limit)
select b.id, '2000-01-01'::date, b.amount_limit
from public.budgets b
where not exists (
  select 1
  from public.budget_limits bl
  where bl.budget_id = b.id
    and bl.month_start = '2000-01-01'::date
);

-- amount_limit y month_start en budgets dejan de ser fuente de verdad.
-- Se mantienen como columnas espejo / legado (NOT NULL) hasta limpieza futura.
-- month_start se fija al ancla; amount_limit se sincroniza con el límite más reciente vía app.

update public.budgets set month_start = '2000-01-01';

alter table public.budget_limits enable row level security;

drop policy if exists "budget_limits_crud_own" on public.budget_limits;
create policy "budget_limits_crud_own" on public.budget_limits
  for all
  using (
    exists (
      select 1
      from public.budgets b
      where b.id = budget_limits.budget_id
        and b.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.budgets b
      where b.id = budget_limits.budget_id
        and b.user_id = auth.uid()
    )
  );
