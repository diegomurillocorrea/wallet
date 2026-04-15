-- Tarjetas de crédito (PAN completo: riesgo documentado en spec.md §5)
-- y vínculo opcional desde presupuestos.

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

alter table public.budgets
  add column if not exists credit_card_id uuid references public.credit_cards (id) on delete set null;

create index if not exists budgets_credit_card_id_idx on public.budgets (credit_card_id);

alter table public.credit_cards enable row level security;

drop policy if exists "credit_cards_crud_own" on public.credit_cards;
create policy "credit_cards_crud_own" on public.credit_cards
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

comment on table public.credit_cards is 'Uso personal; PAN sensibles — ver spec.md';
comment on column public.budgets.credit_card_id is 'Tarjeta asociada al débito/revisión mensual (opcional).';
