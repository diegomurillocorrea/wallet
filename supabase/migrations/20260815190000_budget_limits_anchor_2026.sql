-- Reubicar ancla de límites migrados: 2000-01-01 → 2026-01-01
-- (primera versión visible de presupuestos legacy = enero 2026).

-- Si ya hay fila en 2026-01-01, conservar esa y borrar el ancla 2000.
delete from public.budget_limits bl
where bl.month_start = '2000-01-01'::date
  and exists (
    select 1
    from public.budget_limits other
    where other.budget_id = bl.budget_id
      and other.month_start = '2026-01-01'::date
  );

-- El resto: mover el ancla a enero 2026.
update public.budget_limits
set month_start = '2026-01-01'::date
where month_start = '2000-01-01'::date;

comment on column public.budget_limits.month_start is
  'Primer día del mes (YYYY-MM-01). Presupuestos migrados arrancan en 2026-01-01; los nuevos en el mes de alta.';
