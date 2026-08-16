import type { TransactionKind } from "@/lib/types/wallet"

export interface DefaultCategorySeed {
  name: string
  kind: TransactionKind
  color: string
  icon: string
}

export const DEFAULT_CATEGORIES: DefaultCategorySeed[] = [
  { name: "Comida", kind: "expense", color: "#c9a227", icon: "utensils-crossed" },
  { name: "Transporte", kind: "expense", color: "#5a7a3a", icon: "car" },
  { name: "Vivienda", kind: "expense", color: "#013e37", icon: "home" },
  { name: "Entretenimiento", kind: "expense", color: "#d4b86a", icon: "gamepad-2" },
  { name: "Salud", kind: "expense", color: "#8a6a20", icon: "heart-pulse" },
  { name: "Educación", kind: "expense", color: "#02685c", icon: "graduation-cap" },
  { name: "Otros gastos", kind: "expense", color: "#6b6350", icon: "more-horizontal" },
  { name: "Salario", kind: "income", color: "#013e37", icon: "banknote" },
  { name: "Freelance", kind: "income", color: "#2d7a6e", icon: "laptop" },
  { name: "Inversiones", kind: "income", color: "#4a9a7a", icon: "trending-up" },
  { name: "Otros ingresos", kind: "income", color: "#8aaa4a", icon: "wallet" },
]
