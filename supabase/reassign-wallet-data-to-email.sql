-- Reasigná categorías, movimientos y presupuestos de un usuario de Supabase Auth
-- al usuario con correo diegomurillocorrea@gmail.com (por ejemplo, datos creados
-- con otra cuenta de prueba).
--
-- IMPORTANTE:
-- 1) Primero iniciá sesión al menos una vez con Google usando ese correo para
--    que exista la fila en auth.users.
-- 2) Copiá el UUID del usuario ORIGEN (el que tenía los datos viejos) desde
--    Authentication → Users o desde el Table Editor (columna user_id).
-- 3) Ejecutá este bloque en el SQL Editor de Supabase (rol con permisos sobre
--    public.* y lectura de auth.users).

do $$
declare
  target_email constant text := 'diegomurillocorrea@gmail.com';
  target_id uuid;
  source_id uuid := '00000000-0000-0000-0000-000000000000'::uuid; -- reemplazá por el UUID origen
begin
  if source_id = '00000000-0000-0000-0000-000000000000'::uuid then
    raise exception 'Definí source_id con el UUID del usuario que tiene los datos actuales.';
  end if;

  select id into strict target_id from auth.users where lower(email) = lower(target_email);

  if source_id = target_id then
    raise exception 'El origen y el destino son el mismo usuario.';
  end if;

  update public.categories set user_id = target_id where user_id = source_id;
  update public.transactions set user_id = target_id where user_id = source_id;
  update public.budgets set user_id = target_id where user_id = source_id;
end $$;
