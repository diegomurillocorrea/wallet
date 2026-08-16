-- Dejar de persistir PAN completo: solo BIN (6) + últimos 4.

alter table public.credit_cards
  add column if not exists bin text,
  add column if not exists last4 text;

update public.credit_cards
set
  bin = left(pan, 6),
  last4 = right(pan, 4)
where pan is not null
  and (bin is null or last4 is null);

alter table public.credit_cards
  alter column bin set not null,
  alter column last4 set not null;

alter table public.credit_cards
  drop constraint if exists credit_cards_pan_check;

alter table public.credit_cards drop column if exists pan;

alter table public.credit_cards
  drop constraint if exists credit_cards_bin_check,
  drop constraint if exists credit_cards_last4_check;

alter table public.credit_cards
  add constraint credit_cards_bin_check
    check (char_length(bin) = 6 and bin ~ '^[0-9]{6}$'),
  add constraint credit_cards_last4_check
    check (char_length(last4) = 4 and last4 ~ '^[0-9]{4}$');

create unique index if not exists credit_cards_user_bin_last4_unique
  on public.credit_cards (user_id, bin, last4);

comment on column public.credit_cards.bin is 'Primeros 6 dígitos (BIN). No se guarda el PAN completo.';
comment on column public.credit_cards.last4 is 'Últimos 4 dígitos. No se guarda el PAN completo.';
