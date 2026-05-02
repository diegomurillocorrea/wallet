import { cookies } from "next/headers"
import { parseISO } from "date-fns"
import { currentMonthRange, normalizeMonthStartInput } from "@/lib/dates/month"

export const WALLET_APP_MONTH_COOKIE = "wallet_app_month"

/** Rango del mes elegido en la app (cookie); si no hay cookie, mes calendario actual */
export const getWalletAppMonthRange = async () => {
  const jar = await cookies()
  const raw = jar.get(WALLET_APP_MONTH_COOKIE)?.value
  const monthStart = normalizeMonthStartInput(raw)
  const d = parseISO(monthStart)
  if (Number.isNaN(d.getTime())) {
    return currentMonthRange()
  }
  return currentMonthRange(d)
}
