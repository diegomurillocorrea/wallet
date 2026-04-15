# Especificación: módulo de tarjetas de crédito y vínculo con presupuestos

## 1. Objetivo del producto

Permitir registrar **tarjetas de crédito** como entidades reutilizables y **asociar cada presupuesto mensual** (categoría + mes + día de pago) a la tarjeta con la que se espera que se cargue el gasto recurrente o el “autopago” mental. Así, en la vista de presupuestos queda claro **a qué plástico corresponde cada carga mensual**, sin confundir tarjetas cuando hay varias.

## 2. Contexto del proyecto actual

- **Backend:** Supabase (Postgres + RLS + `auth.users`).
- **Presupuestos:** tabla `public.budgets` con `user_id`, `category_id`, `amount_limit`, `month_start`, `payment_day` (1–31). Unicidad `(user_id, category_id, month_start)`.
- **App:** Next.js App Router, Server Actions en `app/(app)/actions/wallet-actions.ts`, tipos en `lib/types/wallet.ts`, UI presupuestos en `app/(app)/budgets`, shell en `components/app-shell.tsx`.

Este módulo se apoya en ese modelo: **un presupuesto puede referenciar opcionalmente una tarjeta**.

## 3. Alcance funcional

### 3.1 Registrar y gestionar tarjetas

- **Crear** tarjeta con:
  - **Número:** 16 dígitos (solo dígitos; validación de longitud y, opcionalmente, algoritmo de Luhn en fase 2).
  - **Titular:** nombre y apellido (texto; se puede guardar en un solo campo `holder_name` o `first_name` + `last_name` según convenga en implementación).
  - **Vencimiento:** mes y año en formato lógico **MM/AA** (en BD: `exp_month` smallint 1–12, `exp_year` smallint 0–99 o año completo 2000+; se documenta en migración).
- **Listar** tarjetas del usuario (en listados **no** mostrar los 16 dígitos completos; ver §5).
- **Editar** y **eliminar** tarjeta propia.
- **Eliminar con política:** si una tarjeta está vinculada a presupuestos, decidir en implementación:
  - **Opción A (recomendada):** impedir borrado y pedir desvincular desde presupuestos.
  - **Opción B:** borrado en cascada del FK en presupuestos → `credit_card_id` pasa a `NULL`.

### 3.2 Vincular tarjeta ↔ presupuestos

- Cada fila de `budgets` puede tener **como máximo una** tarjeta asociada (`credit_card_id` nullable).
- Semántica: “el límite / revisión de este presupuesto para este mes se concibe como cargado (o revisado) en esta tarjeta el día `payment_day`”.
- En **formulario de presupuesto** (`BudgetForm`): selector opcional “Tarjeta (opcional)” con lista de tarjetas del usuario + opción “Sin tarjeta”.
- En **lista Estado del mes** (`BudgetsWorkspace`): mostrar una línea secundaria o badge con **identificador seguro** de tarjeta (ej. últimos 4 + marca si existe en fase 2) y titular abreviado si aplica.

### 3.3 Navegación

- Nueva ruta dedicada, por ejemplo **`/credit-cards`**, enlazada desde el **sidebar** (`app-shell`) junto a Presupuestos / Dashboard.
- Contenido mínimo de la página: listado + acciones crear/editar/eliminar (diálogos o formularios coherentes con el resto de la app).

## 4. Modelo de datos propuesto

### 4.1 Tabla `public.credit_cards`

| Columna        | Tipo        | Notas |
|----------------|------------|--------|
| `id`           | `uuid` PK  | `gen_random_uuid()` |
| `user_id`      | `uuid` FK  | `auth.users(id)` ON DELETE CASCADE |
| `pan`          | `text`     | 16 dígitos; ver **§5 seguridad** y tratamiento en UI |
| `holder_first_name` | `text` | obligatorio |
| `holder_last_name`  | `text` | obligatorio |
| `exp_month`    | `smallint` | 1–12 |
| `exp_year`     | `smallint` | Año calendario (ej. 2028) o convención única documentada |
| `created_at`   | `timestamptz` | default `now()` |
| `updated_at`   | `timestamptz` | opcional, triggers o app |

Índices: `(user_id)`, opcional único de negocio si en el futuro se deduplica por usuario (no obligatorio en v1).

**RLS:** políticas análogas a `budgets` / `categories` — solo el dueño (`auth.uid() = user_id`) puede CRUD.

### 4.2 Cambio en `public.budgets`

- Añadir `credit_card_id uuid references public.credit_cards(id) on delete set null` (o `restrict` si se elige Opción A de borrado).
- Nullable: presupuestos existentes siguen válidos sin tarjeta.

### 4.3 Migraciones

- Nuevo archivo SQL en `supabase/migrations/` con `create table`, RLS, políticas y `alter table budgets`.
- Actualizar `supabase/schema.sql` de referencia para quien bootstrap desde cero.

## 5. Seguridad y cumplimiento (obligatorio en el diseño)

Almacenar el **PAN completo (16 dígitos)** en base de datos implica **riesgo elevado** (filtración de backups, logs, XSS, insider). Desde el punto de vista **PCI DSS**, conservar datos de titular de cuenta en servidores propios suele acarrear obligaciones fuertes.

**Recomendaciones para el spec (decisión de producto antes o durante implementación):**

1. **Mínimo viable seguro:** guardar solo **últimos 4** + opcionalmente **primeros 6 (BIN)** para reconocer banco/red; el resto no persistir. Si el producto exige “tener los 16”, valorar **cifrado aplicación-nivel** (clave fuera de BD) o almacenamiento externo certificado — documentar la opción elegida en README interno, no en este spec salvo una línea.
2. **En UI:** campo de número tipo password / máscara inmediata después de blur; nunca volver a mostrar 16 dígitos completos en pantalla tras guardar.
3. **Logs y errores:** nunca registrar el PAN en logs del servidor o del cliente.
4. **Transporte:** solo HTTPS (ya asumido en producción).

El spec de implementación **asume** que el usuario quiere el flujo “16 dígitos en alta”, pero la **tarea de implementación** debe incluir explícitamente la elección entre almacenamiento completo vs truncado/cifrado, acorde a la tolerancia al riesgo del proyecto.

## 6. Capa de aplicación

### 6.1 Tipos TypeScript

- En `lib/types/wallet.ts` (o módulo dedicado): `CreditCardRow`, campos serializables servidor → cliente **sin** exponer `pan` completo en props de listado; usar `last4` derivado en consulta o columna generada / vista.

### 6.2 Server Actions

- Extender `wallet-actions.ts` (o archivo dedicado `credit-card-actions.ts` si se prefiere separar):
  - `createCreditCard`, `updateCreditCard`, `deleteCreditCard`, `listCreditCardsForUser`.
- Extender `upsertBudget` / `updateBudget`:
  - Aceptar `creditCardId` opcional desde `FormData`.
  - Validar con Zod: UUID opcional; si viene, comprobar que la tarjeta pertenece al `user.id`.

### 6.3 Consultas de presupuestos

- `getBudgetAlertsForUser` (y cualquier select de presupuestos para edición): join o select anidado para traer `last4`, `holder` resumido, `exp_month`/`exp_year` para mostrar “vence MM/AA”.

## 7. UI / UX

- **Tarjetas:** formulario accesible (labels, `aria-*`, teclado), inputs con `inputMode="numeric"`, máscaras de fecha MM/AA.
- **Presupuestos:** select con nombres legibles (“Visa •••• 4242 — Juan P.”).
- **Vacío:** CTA para ir a crear tarjeta si no hay ninguna.
- Estilo: alineado a DAIEGO (zinc / emerald, patrones existentes en formularios).

## 8. Fases de entrega sugeridas

| Fase | Contenido |
|------|-----------|
| **Fase 0** | Decisión escrita: PAN completo vs solo últimos 4 (+ BIN) vs cifrado. |
| **Fase 1** | Migración BD + RLS + tipos + actions CRUD tarjetas + página `/credit-cards`. |
| **Fase 2** | FK en `budgets`, formulario y queries de presupuestos + badges en “Estado del mes”. |
| **Fase 3** | Pulido: Luhn opcional, etiqueta personalizada por tarjeta (“Azul trabajo”), icono de red si hay BIN. |

## 9. Criterios de aceptación (resumen)

- Un usuario autenticado solo ve y modifica sus propias tarjetas (RLS + comprobaciones en actions).
- Se puede crear presupuesto con o sin tarjeta; al editar, se conserva o actualiza la asociación.
- En listado de presupuestos del mes se indica claramente qué tarjeta (representación segura) acompaña a cada ítem cuando existe vínculo.
- No hay fugas del PAN completo en respuestas JSON usadas para renderizar listas.

## 10. Fuera de alcance (v1)

- Integración con bancos u Open Banking.
- Recordatorios push/email de vencimiento de tarjeta.
- Conciliación automática con transacciones importadas (posible **fase futura**: sugerir transacciones que “parecen” de una tarjeta por nota o reglas).

## 11. Checklist previo a implementación

- [ ] Decisión PAN / truncado / cifrado (§5).
- [ ] Política ON DELETE de `credit_card_id` (§3.1).
- [ ] Año de expiración: convención única en BD (§4.1).
- [ ] Copia legal / aviso breve en pantalla de alta de tarjeta (riesgo, uso personal).

---

*Documento vivo: actualizar este `spec.md` si cambian requisitos de seguridad o el modelo de vínculo (p. ej. varias tarjetas por presupuesto vía tabla puente).*
