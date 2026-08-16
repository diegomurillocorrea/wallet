import { roundMoney } from "@/lib/format/money"
import type { createClient } from "@/lib/supabase/server"

type Supabase = Awaited<ReturnType<typeof createClient>>

/**
 * Gasto por categoría en un rango de fechas, vía SUM en Postgres.
 * Clave = category_id, valor = total redondeado a 2 decimales.
 */
export const fetchExpenseSumByCategory = async (
  supabase: Supabase,
  userId: string,
  rangeStart: string,
  rangeEnd: string
): Promise<Map<string, number>> => {
  const { data, error } = await supabase
    .from("transactions")
    .select("category_id, spent:amount.sum()")
    .eq("user_id", userId)
    .eq("kind", "expense")
    .gte("occurred_at", rangeStart)
    .lte("occurred_at", rangeEnd)

  const map = new Map<string, number>()
  if (error) {
    console.error("fetchExpenseSumByCategory", error.message)
    return map
  }

  for (const row of data ?? []) {
    const categoryId = row.category_id as string | null
    if (!categoryId) continue
    const raw = (row as { spent?: number | string | null }).spent
    map.set(categoryId, roundMoney(Number(raw ?? 0)))
  }
  return map
}

/** Totales de ingreso y gasto del mes vía SUM en Postgres. */
export const fetchMonthIncomeExpenseTotals = async (
  supabase: Supabase,
  userId: string,
  rangeStart: string,
  rangeEnd: string
): Promise<{ income: number, expense: number, error?: string }> => {
  const { data, error } = await supabase
    .from("transactions")
    .select("kind, total:amount.sum()")
    .eq("user_id", userId)
    .gte("occurred_at", rangeStart)
    .lte("occurred_at", rangeEnd)

  if (error) {
    return { income: 0, expense: 0, error: error.message }
  }

  let income = 0
  let expense = 0
  for (const row of data ?? []) {
    const kind = row.kind as string
    const total = roundMoney(Number((row as { total?: number | string | null }).total ?? 0))
    if (kind === "income") income = total
    else if (kind === "expense") expense = total
  }
  return { income, expense }
}
