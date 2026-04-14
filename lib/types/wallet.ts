export type TransactionKind = "expense" | "income"

export interface CategoryRow {
  id: string
  user_id: string
  name: string
  kind: TransactionKind
  color: string
  icon: string
  /** Legado en BD; la app trata todas las categorías por igual */
  is_system: boolean
  created_at: string
}

export interface TransactionRow {
  id: string
  user_id: string
  category_id: string
  amount: number
  kind: TransactionKind
  note: string | null
  occurred_at: string
  created_at: string
}

export interface BudgetRow {
  id: string
  user_id: string
  category_id: string
  amount_limit: number
  month_start: string
  /** Día del mes (1–31) para día de pago o revisión del presupuesto */
  payment_day: number
}

/** Datos para rellenar el formulario al editar un presupuesto */
export interface BudgetEditTarget {
  budgetId: string
  categoryId: string
  categoryName: string
  limit: number
  monthStart: string
  paymentDay: number
}

/** Fila de alerta / lista de presupuestos del mes (serializable servidor → cliente) */
export interface BudgetAlertRow {
  budgetId: string
  categoryId: string
  categoryName: string
  color: string
  icon: string
  spent: number
  limit: number
  ratio: number
  level: "ok" | "warn" | "over"
  monthStart: string
  paymentDay: number
}

export interface TransactionWithCategory extends TransactionRow {
  category: Pick<CategoryRow, "id" | "name" | "color" | "icon" | "kind">
}
