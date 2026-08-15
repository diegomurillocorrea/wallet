import { parseISO } from "date-fns"

export const EL_SALVADOR_TIME_ZONE = "America/El_Salvador"
export const EL_SALVADOR_LOCALE = "es-SV"

const isoDateInTimeZone = new Intl.DateTimeFormat("en-CA", {
  timeZone: EL_SALVADOR_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
})

const displayDateFormatter = new Intl.DateTimeFormat(EL_SALVADOR_LOCALE, {
  timeZone: "UTC",
  day: "numeric",
  month: "short",
  year: "numeric",
})

/** "Hoy" como fecha calendario en El Salvador, formato YYYY-MM-DD */
export const todayInElSalvador = (now: Date = new Date()): string =>
  isoDateInTimeZone.format(now)

/** "Hoy" como Date (medianoche UTC del día calendario en El Salvador) para date-fns */
export const todayDateInElSalvador = (now: Date = new Date()): Date =>
  parseISO(todayInElSalvador(now))

/** YYYY-MM-DD → "27 jul 2026" en es-SV. `timeZone: UTC` evita correr el día calendario */
export const formatDateEsSV = (isoDate: string): string => {
  const d = parseISO(isoDate.slice(0, 10))
  if (Number.isNaN(d.getTime())) return isoDate
  return displayDateFormatter.format(d)
}
