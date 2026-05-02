-- Un presupuesto por (usuario, categoría), como las categorías. month_start queda ancla técnica.

-- Quitar duplicados: conservar el registro con month_start más reciente por par usuario/categoría
DELETE FROM public.budgets b
WHERE NOT EXISTS (
  SELECT 1
  FROM (
    SELECT DISTINCT ON (user_id, category_id) id
    FROM public.budgets
    ORDER BY user_id, category_id, month_start DESC
  ) keep
  WHERE keep.id = b.id
);

UPDATE public.budgets SET month_start = '2000-01-01';

-- Unique legacy (user_id, category_id, month_start): el nombre en Postgres puede variar
DO $$
DECLARE
  cname text;
BEGIN
  FOR cname IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'budgets'
      AND c.contype = 'u'
      AND pg_get_constraintdef(c.oid) LIKE '%user_id%'
      AND pg_get_constraintdef(c.oid) LIKE '%category_id%'
      AND pg_get_constraintdef(c.oid) LIKE '%month_start%'
  LOOP
    EXECUTE format('ALTER TABLE public.budgets DROP CONSTRAINT %I', cname);
  END LOOP;
END $$;

ALTER TABLE public.budgets DROP CONSTRAINT IF EXISTS budgets_user_id_category_id_month_start_key;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'budgets'
      AND c.conname = 'budgets_user_category_unique'
  ) THEN
    ALTER TABLE public.budgets
      ADD CONSTRAINT budgets_user_category_unique UNIQUE (user_id, category_id);
  END IF;
END $$;

COMMENT ON COLUMN public.budgets.month_start IS
  'Ancla técnica (legado). El límite aplica a toda categoría; el gasto se compara con el mes de contexto en la app.';
