-- Ejecutá este script en el SQL Editor de Supabase si la tabla budgets ya existía
-- sin la columna payment_day.

alter table public.budgets
  add column if not exists payment_day smallint not null default 1
    check (payment_day >= 1 and payment_day <= 31);

comment on column public.budgets.payment_day is 'Día del mes en que aplica el pago o revisión (1–31).';
