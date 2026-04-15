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
  credit_card_id: string | null
  amount_limit: number
  month_start: string
  /** Día del mes (1–31) para día de pago o revisión del presupuesto */
  payment_day: number
}

/** Tarjeta serializable a cliente (sin PAN completo) */
export interface CreditCardListItem {
  id: string
  holder_first_name: string
  holder_last_name: string
  last4: string
  exp_month: number
  exp_year: number
  exp_label: string
}

/** Presupuesto vinculado a una tarjeta (lista por tarjeta) */
export interface BudgetLinkedToCardRow {
  budgetId: string
  categoryId: string
  categoryName: string
  color: string
  icon: string
  amountLimit: number
  /** Gasto acumulado en esa categoría durante el mes del presupuesto */
  spent: number
  monthStart: string
  paymentDay: number
}

export interface CreditCardBudgetUsageGroup {
  card: CreditCardListItem
  budgets: BudgetLinkedToCardRow[]
  /** Suma de los `spent` de los presupuestos vinculados a esta tarjeta */
  totalSpentOnCard: number
}

export interface BudgetCardSummary {
  last4: string
  holderShort: string
  exp_label: string
}

/** Datos para rellenar el formulario al editar un presupuesto */
export interface BudgetEditTarget {
  budgetId: string
  categoryId: string
  categoryName: string
  limit: number
  monthStart: string
  paymentDay: number
  creditCardId: string | null
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
  creditCardId: string | null
  card: BudgetCardSummary | null
}

export interface TransactionWithCategory extends TransactionRow {
  category: Pick<CategoryRow, "id" | "name" | "color" | "icon" | "kind">
}
