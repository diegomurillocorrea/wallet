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
}

export interface TransactionWithCategory extends TransactionRow {
  category: Pick<CategoryRow, "id" | "name" | "color" | "icon" | "kind">
}
