import { listCreditCardsForUser } from "@/app/(app)/actions/credit-card-actions"
import { getBudgetAlertsForUser } from "@/app/(app)/actions/wallet-actions"
import { BudgetsWorkspace } from "@/components/budgets-workspace"
import { Heading } from "@/components/ui/heading"
import { Text } from "@/components/ui/text"
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

  const { start, end, monthStart } = await getWalletAppMonthRange()
  const [budgets, creditCards] = await Promise.all([getBudgetAlertsForUser(), listCreditCardsForUser()])

  return (
    <div className="flex flex-col gap-8">
      <header>
        <Heading>Presupuestos</Heading>
        <Text className="mt-1">
          Límites recurrentes por categoría · avance según {monthLabel(monthStart)} (mismo mes que Resumen)
        </Text>
      </header>

      <BudgetsWorkspace
        expenseCategories={expenseCategories}
        creditCards={creditCards}
        budgets={budgets}
        defaultPaymentMonthStart={start}
        defaultPaymentMonthEnd={end}
      />
    </div>
  )
}
