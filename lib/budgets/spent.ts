import { roundMoney } from "@/lib/format/money"
import type { createClient } from "@/lib/supabase/server"

type Supabase = Awaited<ReturnType<typeof createClient>>

interface AmountByCategoryRow {
  category_id: string | null
  amount: number | string | null
}

interface KindAmountRow {
  kind: string
  amount: number | string | null
}

/** Suma gastos por categoría. Clave = category_id. */
export const sumExpenseByCategory = (rows: AmountByCategoryRow[]): Map<string, number> => {
  const totals = new Map<string, number>()
  for (const row of rows) {
    const categoryId = row.category_id
    if (!categoryId) continue
    const prev = totals.get(categoryId) ?? 0
    totals.set(categoryId, prev + Number(row.amount ?? 0))
  }
  const rounded = new Map<string, number>()
  for (const [id, total] of totals) {
    rounded.set(id, roundMoney(total))
  }
  return rounded
}

export const sumIncomeExpenseTotals = (
  rows: KindAmountRow[]
): { income: number, expense: number } => {
  let income = 0
  let expense = 0
  for (const row of rows) {
    const amount = Number(row.amount ?? 0)
    if (row.kind === "income") income += amount
    else if (row.kind === "expense") expense += amount
  }
  return { income: roundMoney(income), expense: roundMoney(expense) }
}

/**
 * Gasto por categoría en un rango de fechas.
 * PostgREST bloquea SUM en la Data API ("Use of aggregate functions is not allowed"),
 * así que se suman los montos en la app.
 */
export const fetchExpenseSumByCategory = async (
  supabase: Supabase,
  userId: string,
  rangeStart: string,
  rangeEnd: string
): Promise<Map<string, number>> => {
  const { data, error } = await supabase
    .from("transactions")
    .select("category_id, amount")
    .eq("user_id", userId)
    .eq("kind", "expense")
    .gte("occurred_at", rangeStart)
    .lte("occurred_at", rangeEnd)

  if (error) {
    console.error("fetchExpenseSumByCategory", error.message)
    return new Map()
  }

  return sumExpenseByCategory(data ?? [])
}

/** Totales de ingreso y gasto del mes. */
export const fetchMonthIncomeExpenseTotals = async (
  supabase: Supabase,
  userId: string,
  rangeStart: string,
  rangeEnd: string
): Promise<{ income: number, expense: number, error?: string }> => {
  const { data, error } = await supabase
    .from("transactions")
    .select("kind, amount")
    .eq("user_id", userId)
    .gte("occurred_at", rangeStart)
    .lte("occurred_at", rangeEnd)

  if (error) {
    return { income: 0, expense: 0, error: error.message }
  }

  return sumIncomeExpenseTotals(data ?? [])
}
