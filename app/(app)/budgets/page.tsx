import { listCreditCardsForUser } from "@/app/(app)/actions/credit-card-actions"
import { getBudgetAlertsForUser } from "@/app/(app)/actions/wallet-actions"
import { BudgetsWorkspace } from "@/components/budgets-workspace"
import { PageHeader } from "@/components/page-header"
import { Notice } from "@/components/ui/notice"
import { WalletAppMonthSelect } from "@/components/wallet-app-month-select"
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
    .order("name")

  const allCategories = (categoriesData ?? []) as CategoryRow[]
  const expenseCategories = allCategories.filter((c) => c.kind === "expense")

  const { start, end, monthStart } = await getWalletAppMonthRange()
  const [budgets, cardsResult] = await Promise.all([
    getBudgetAlertsForUser(),
    listCreditCardsForUser(),
  ])
  const creditCards = cardsResult.ok ? cardsResult.cards : []

  return (
    <div className="flex flex-col gap-3">
      <PageHeader
        title="Presupuestos"
        aside={<WalletAppMonthSelect monthStart={monthStart} />}
      >
        Techos de gasto por categoría · avance según {monthLabel(monthStart)}
      </PageHeader>

      {!cardsResult.ok ? (
        <Notice tone="warning">No se pudieron cargar las tarjetas: {cardsResult.error}</Notice>
      ) : null}

      <BudgetsWorkspace
        expenseCategories={expenseCategories}
        allCategories={allCategories}
        creditCards={creditCards}
        budgets={budgets}
        defaultPaymentMonthStart={start}
        defaultPaymentMonthEnd={end}
      />
    </div>
  )
}
