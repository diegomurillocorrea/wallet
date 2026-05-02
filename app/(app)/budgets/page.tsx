import { listCreditCardsForUser } from "@/app/(app)/actions/credit-card-actions"
import { getBudgetAlertsForUser } from "@/app/(app)/actions/wallet-actions"
import { BudgetsWorkspace } from "@/components/budgets-workspace"
import { monthLabel } from "@/lib/dates/month"
import { getWalletAppMonthRange } from "@/lib/dates/wallet-app-month"
import { createClient } from "@/lib/supabase/server"
import type { CategoryRow } from "@/lib/types/wallet"

export default async function BudgetsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: categoriesData } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", user.id)
    .eq("kind", "expense")
    .order("name")

  const expenseCategories = (categoriesData ?? []) as CategoryRow[]

  const { monthStart } = await getWalletAppMonthRange()
  const [budgets, creditCards] = await Promise.all([getBudgetAlertsForUser(), listCreditCardsForUser()])

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Presupuestos
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Límites recurrentes por categoría · avance según {monthLabel(monthStart)} (mismo mes que Resumen)
        </p>
      </header>

      <BudgetsWorkspace expenseCategories={expenseCategories} creditCards={creditCards} budgets={budgets} />
    </div>
  )
}
