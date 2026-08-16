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
  /** Espejo legado; la fuente de verdad del límite está en budget_limits */
  amount_limit: number
  /** Ancla técnica legado; el mes de contexto viene de la cookie */
  month_start: string
  /** Día del mes (1–31) para día de pago o revisión del presupuesto */
  payment_day: number
}

export interface BudgetLimitRow {
  id: string
  budget_id: string
  month_start: string
  amount_limit: number
}

/** Tarjeta serializable a cliente (sin PAN completo) */
export interface CreditCardListItem {
  id: string
  holder_first_name: string
  holder_last_name: string
  bin: string
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
  /** Gasto en esa categoría en el mes de contexto (misma cookie que Resumen) */
  spent: number
  /** Primer día del mes de contexto para etiquetas UI */
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
  paymentDay: number
  creditCardId: string | null
}

/** Movimiento de gasto que suma al presupuesto de una categoría en el mes */
export interface BudgetCategoryMovement {
  id: string
  amount: number
  note: string | null
  occurredAt: string
  categoryId?: string
  kind?: TransactionKind
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
  /** Mes de contexto (cookie): el gasto comparado con el límite es de este mes */
  monthStart: string
  paymentDay: number
  creditCardId: string | null
  card: BudgetCardSummary | null
  movements: BudgetCategoryMovement[]
}

export interface TransactionWithCategory extends TransactionRow {
  category: Pick<CategoryRow, "id" | "name" | "color" | "icon" | "kind">
}
