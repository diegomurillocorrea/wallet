import type { TransactionKind } from "@/lib/types/wallet"

export interface DefaultCategorySeed {
  name: string
  kind: TransactionKind
  color: string
  icon: string
}

export const DEFAULT_CATEGORIES: DefaultCategorySeed[] = [
  { name: "Comida", kind: "expense", color: "#f97316", icon: "UtensilsCrossed" },
  { name: "Transporte", kind: "expense", color: "#3b82f6", icon: "Car" },
  { name: "Vivienda", kind: "expense", color: "#8b5cf6", icon: "Home" },
  { name: "Entretenimiento", kind: "expense", color: "#ec4899", icon: "Gamepad2" },
  { name: "Salud", kind: "expense", color: "#ef4444", icon: "HeartPulse" },
  { name: "Educación", kind: "expense", color: "#14b8a6", icon: "GraduationCap" },
  { name: "Otros gastos", kind: "expense", color: "#64748b", icon: "MoreHorizontal" },
  { name: "Salario", kind: "income", color: "#22c55e", icon: "Banknote" },
  { name: "Freelance", kind: "income", color: "#10b981", icon: "Laptop" },
  { name: "Inversiones", kind: "income", color: "#06b6d4", icon: "TrendingUp" },
  { name: "Otros ingresos", kind: "income", color: "#84cc16", icon: "Wallet" },
]
