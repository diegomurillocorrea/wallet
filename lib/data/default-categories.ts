import type { TransactionKind } from "@/lib/types/wallet"

export interface DefaultCategorySeed {
  name: string
  kind: TransactionKind
  color: string
  icon: string
}

export const DEFAULT_CATEGORIES: DefaultCategorySeed[] = [
  { name: "Comida", kind: "expense", color: "#f97316", icon: "utensils-crossed" },
  { name: "Transporte", kind: "expense", color: "#3b82f6", icon: "car" },
  { name: "Vivienda", kind: "expense", color: "#8b5cf6", icon: "home" },
  { name: "Entretenimiento", kind: "expense", color: "#ec4899", icon: "gamepad-2" },
  { name: "Salud", kind: "expense", color: "#ef4444", icon: "heart-pulse" },
  { name: "Educación", kind: "expense", color: "#14b8a6", icon: "graduation-cap" },
  { name: "Otros gastos", kind: "expense", color: "#64748b", icon: "more-horizontal" },
  { name: "Salario", kind: "income", color: "#22c55e", icon: "banknote" },
  { name: "Freelance", kind: "income", color: "#10b981", icon: "laptop" },
  { name: "Inversiones", kind: "income", color: "#06b6d4", icon: "trending-up" },
  { name: "Otros ingresos", kind: "income", color: "#84cc16", icon: "wallet" },
]
