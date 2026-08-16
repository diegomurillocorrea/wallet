import { addMonths, format, getDaysInMonth, parseISO, setDate, startOfMonth } from "date-fns"
import { monthStartIso } from "@/lib/dates/month"
import { todayDateInElSalvador } from "@/lib/dates/el-salvador"

/** Primera versión visible para presupuestos migrados desde el ancla legado */
export const BUDGET_HISTORY_START = "2026-01-01"

export interface BudgetLimitVersion {
  monthStart: string
  amountLimit: number
}

/**
 * Límite efectivo para `viewMonthStart` (YYYY-MM-01).
 * - Si viewMonth es anterior a la primera versión → null (no mostrar).
 * - Si hay fila exacta → esa.
 * - Si no → última versión con month_start <= viewMonth.
 */
export const resolveEffectiveLimit = (
  versions: BudgetLimitVersion[],
  viewMonthStart: string
): number | null => {
  if (versions.length === 0) return null
  const view = viewMonthStart.slice(0, 10)
  const sorted = [...versions].sort((a, b) => a.monthStart.localeCompare(b.monthStart))
  const first = sorted[0]!.monthStart.slice(0, 10)
  if (view < first) return null

  let effective: number | null = null
  for (const v of sorted) {
    const m = v.monthStart.slice(0, 10)
    if (m > view) break
    effective = v.amountLimit
  }
  return effective
}

/**
 * Meses a materializar / upsert al editar el límite.
 *
 * Regla acordada (hoy = currentCalendarMonth):
 * - Mes seleccionado **pasado**: upsert solo ese mes.
 *   Si el mes siguiente (o el calendario actual si es el siguiente lógico)
 *   no tiene fila propia, materializar el valor que tenía antes del cambio
 *   para que no herede el nuevo valor del pasado.
 * - Mes seleccionado **actual o futuro**: upsert ese mes.
 *   Los meses posteriores con versión propia no se tocan.
 */
export const planLimitEdit = (
  versions: BudgetLimitVersion[],
  selectedMonthStart: string,
  newAmount: number,
  currentCalendarMonthStart: string = monthStartIso(todayDateInElSalvador())
): { upserts: BudgetLimitVersion[] } => {
  const selected = selectedMonthStart.slice(0, 10)
  const current = currentCalendarMonthStart.slice(0, 10)
  const previousEffective = resolveEffectiveLimit(versions, selected)

  const upserts: BudgetLimitVersion[] = [
    { monthStart: selected, amountLimit: newAmount },
  ]

  const isPast = selected < current
  if (!isPast) {
    return { upserts }
  }

  // Materializar el mes siguiente al seleccionado con el valor previo,
  // solo si no tiene fila propia (para no contaminar el presente).
  const nextMonth = format(addMonths(parseISO(selected), 1), "yyyy-MM-dd")
  const hasExplicitNext = versions.some((v) => v.monthStart.slice(0, 10) === nextMonth)
  if (!hasExplicitNext && previousEffective != null && previousEffective !== newAmount) {
    upserts.push({ monthStart: nextMonth, amountLimit: previousEffective })
  }

  return { upserts }
}

/** Día de pago acotado al mes (31 en febrero → último día). */
export const paymentDayInMonth = (monthStartIsoStr: string, paymentDay: number): number => {
  const base = parseISO(monthStartIsoStr.slice(0, 10))
  if (Number.isNaN(base.getTime())) return Math.min(31, Math.max(1, paymentDay))
  const dim = getDaysInMonth(base)
  return Math.min(Math.max(1, paymentDay), dim)
}

/** Etiqueta de día de pago: "último día" si el día pedido supera los días del mes. */
export const paymentDayLabel = (monthStartIsoStr: string, paymentDay: number): string => {
  const base = parseISO(monthStartIsoStr.slice(0, 10))
  if (Number.isNaN(base.getTime())) return String(paymentDay)
  const dim = getDaysInMonth(base)
  const safe = Math.min(Math.max(1, paymentDay), dim)
  if (paymentDay > dim) return `último día (${safe})`
  return String(safe)
}

export const nextMonthStartIso = (monthStartIsoStr: string): string =>
  format(startOfMonth(addMonths(parseISO(monthStartIsoStr.slice(0, 10)), 1)), "yyyy-MM-dd")

export const paymentDateForMonth = (monthStartIsoStr: string, paymentDay: number): string => {
  const base = parseISO(monthStartIsoStr.slice(0, 10))
  if (Number.isNaN(base.getTime())) return monthStartIsoStr.slice(0, 10)
  const safe = paymentDayInMonth(monthStartIsoStr, paymentDay)
  return format(setDate(base, safe), "yyyy-MM-dd")
}
