-- budgets.amount_limit y budgets.month_start dejan de existir:
-- la fuente de verdad es public.budget_limits.

alter table public.budgets drop column if exists amount_limit;
alter table public.budgets drop column if exists month_start;

drop index if exists public.budgets_user_month_idx;
