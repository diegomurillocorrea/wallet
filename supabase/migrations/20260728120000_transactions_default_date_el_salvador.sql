-- Default de occurred_at pasa de fecha UTC a fecha calendario de El Salvador (UTC-6)
alter table public.transactions
  alter column occurred_at set default ((now() at time zone 'America/El_Salvador')::date);
