import {
  endOfMonth,
  format,
  getDaysInMonth,
  parseISO,
  setDate,
  startOfMonth,
  subMonths,
} from "date-fns"
import { es } from "date-fns/locale"

export const monthStartIso = (d: Date) => format(startOfMonth(d), "yyyy-MM-dd")

export const monthLabel = (monthStart: string) =>
  format(parseISO(monthStart), "MMMM yyyy", { locale: es })

export const currentMonthRange = (d = new Date()) => {
  const start = startOfMonth(d)
  const end = endOfMonth(d)
  return {
    start: format(start, "yyyy-MM-dd"),
    end: format(end, "yyyy-MM-dd"),
    monthStart: format(start, "yyyy-MM-dd"),
  }
}

export const previousMonthStart = (d = new Date()) =>
  format(startOfMonth(subMonths(d, 1)), "yyyy-MM-dd")

/** Normaliza cualquier fecha del mes al primer día (YYYY-MM-DD) para presupuestos */
export const normalizeMonthStartInput = (input: string | undefined) => {
  if (!input || input.length < 10) return monthStartIso(new Date())
  const d = parseISO(input.slice(0, 10))
  if (Number.isNaN(d.getTime())) return monthStartIso(new Date())
  return format(startOfMonth(d), "yyyy-MM-dd")
}

/** Valor de `input type="date"` → día del mes 1–31 (hora local); inválido → null */
export const parsePaymentDayFromDateInput = (input: string | undefined): number | null => {
  if (!input || input.length < 10) return null
  const d = parseISO(input.slice(0, 10))
  if (Number.isNaN(d.getTime())) return null
  return Math.min(31, Math.max(1, d.getDate()))
}

/** `yyyy-MM-dd` para el date picker: mes del presupuesto + día de pago (acotado al mes) */
export const paymentDateDefaultForMonth = (monthStartIsoStr: string, paymentDay: number) => {
  const base = parseISO(monthStartIsoStr.slice(0, 10))
  if (Number.isNaN(base.getTime())) return format(new Date(), "yyyy-MM-dd")
  const dim = getDaysInMonth(base)
  const safe = Math.min(Math.max(1, paymentDay), dim)
  return format(setDate(base, safe), "yyyy-MM-dd")
}
