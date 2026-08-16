# Especificación: presupuestos, tarjetas y límites por mes

Documento vivo del modelo de negocio de DAIEGO Wallet.

## 1. Objetivo

Controlar techos de gasto por categoría, con límite versionado por mes, y etiquetar visualmente qué presupuestos están ligados a qué tarjeta. No es un libro de la tarjeta ni un estado “pagado”.

## 2. Modelo de dominio

### 2.1 Presupuesto = techo de gasto

- Una definición por `(usuario, categoría de gasto)`: día de pago + tarjeta opcional.
- El **límite** vive en `budget_limits` por mes (`month_start` = día 1).
- Si no hay fila para el mes en contexto, se hereda la última versión con `month_start <=` ese mes.
- Si el mes en contexto es **anterior** a la primera versión, el presupuesto **no se muestra**.
- Presupuestos migrados del ancla legado: primera versión = **2026-01-01**. Los nuevos arrancan en el mes de la cookie.

### 2.2 Edición del límite

Con “hoy” = mes calendario actual (El Salvador):

- Mes seleccionado **pasado**: solo cambia ese mes. Si el mes siguiente no tiene fila propia, se materializa el valor previo para no contaminar el presente.
- Mes seleccionado **actual o futuro**: upsert de ese mes; meses posteriores con versión propia no se tocan.

### 2.3 Registrar gasto

El botón del presupuesto crea un **movimiento de gasto** en esa categoría (suma al techo). Pasarse del límite se permite y se marca “sobre el límite”.

### 2.4 Tarjeta = etiqueta visual

- `credit_card_id` en `budgets` es opcional.
- Semántica: “este techo está ligado a este plástico”.
- La vista “Presupuestos por tarjeta” agrupa por etiqueta; **no** es el saldo de la tarjeta.
- No hay `credit_card_id` en movimientos ni estado “pagado”.

### 2.5 Categorías

- Unique `(user_id, lower(trim(name)), kind)`.
- No se cambia `kind` si hay movimientos o presupuesto.
- No se borra si hay presupuesto (`ON DELETE RESTRICT`); hay que eliminar el presupuesto primero.
- Seed de categorías por defecto una sola vez (`user_settings.default_categories_seeded`). Si el usuario las borra todas, no se re-crean solas.

### 2.6 Movimientos

- `kind` debe coincidir con la categoría (app + trigger).
- Al editar, se puede cambiar a otra categoría del **mismo tipo**.
- Fechas en zona `America/El_Salvador`; el alta rápida se acota al mes en contexto.

## 3. Tarjetas (seguridad)

- **No se persiste el PAN completo.** Solo `bin` (6) + `last4` (4).
- En el formulario se piden 16 dígitos y se valida Luhn; se descarta el resto.
- Borrar tarjeta bloqueado si está vinculada a presupuestos (desvincular primero).
- Unique `(user_id, bin, last4)`.

## 4. Día de pago

- Se guarda `payment_day` 1–31 en la definición del presupuesto.
- En meses cortos, se interpreta y muestra como **último día del mes**.

## 5. Mes de contexto

Cookie `wallet_app_month`. Misma cookie en Resumen, Presupuestos, Movimientos y Vínculos.

## 6. Fuera de alcance (v1)

Cuentas bancarias, recurrentes automáticos, recordatorios, metas, Open Banking, IA, cifrado de PAN, estado “pagado” en tarjeta, medio de pago en el movimiento.

## 7. Migraciones relevantes

- `20260815180000_budget_limits_per_month.sql`
- `20260815180100_integrity_categories_budgets.sql`
- `20260815180200_credit_cards_bin_last4.sql`
- `20260815190000_budget_limits_anchor_2026.sql` — ancla legado → `2026-01-01`
- `20260815190100_drop_budget_mirror_columns.sql` — quita `amount_limit` / `month_start` de `budgets`

## 8. Smoke checklist (manual)

1. Resumen: balance del mes, gráficos, presupuestos, alta rápida acotada al mes.
2. Presupuestos: editar límite en un mes pasado; el mes actual no debe cambiar.
3. Mirar un mes anterior a enero 2026: no deben aparecer presupuestos migrados.
4. Movimientos: editar categoría (mismo tipo), ver selector de mes.
5. Tarjetas: alta con 16 dígitos; listado solo muestra last4; vínculos con texto de etiqueta.
6. Borrar categoría con presupuesto → error; desvincular tarjeta antes de borrar.