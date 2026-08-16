import { listCreditCardsForUser } from "@/app/(app)/actions/credit-card-actions"
import { getBudgetAlertsForUser } from "@/app/(app)/actions/wallet-actions"
import { ExpenseByCategoryChart } from "@/components/charts/expense-by-category-chart"
import { IncomeExpenseBars } from "@/components/charts/income-expense-bars"
import { CategoryIcon } from "@/components/category-icon"
import { EditBudgetDialog } from "@/components/edit-budget-dialog"
import { BudgetMonthDisclosure } from "@/components/budget-month-disclosure"
import { RegisterBudgetPaymentDialog } from "@/components/register-budget-payment-dialog"
import { DeleteTransactionButton } from "@/components/delete-transaction-button"
import { MotionStatCard } from "@/components/motion-stat-card"
import { TransactionQuickForm } from "@/components/transaction-quick-form"
import { monthLabel } from "@/lib/dates/month"
import { formatDateEsSV } from "@/lib/dates/el-salvador"
import { getWalletAppMonthRange } from "@/lib/dates/wallet-app-month"
import { WalletAppMonthSelect } from "@/components/wallet-app-month-select"
import { Heading, Subheading } from "@/components/ui/heading"
import { Text } from "@/components/ui/text"
import { formatMoney, remainingToPay, roundMoney } from "@/lib/format/money"
import { fetchExpenseSumByCategory, fetchMonthIncomeExpenseTotals } from "@/lib/budgets/spent"
import { createClient } from "@/lib/supabase/server"
import type { CategoryRow } from "@/lib/types/wallet"

interface RecentRow {
  id: string
  amount: number | string
  kind: string
  note: string | null
  occurred_at: string
  category: {
    name: string
    color: string
    icon: string
    kind: string
  } | null
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { start, end, monthStart } = await getWalletAppMonthRange()

  const { data: categoriesData } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", user.id)
    .order("name")

  const categories = (categoriesData ?? []) as CategoryRow[]
  const categoryById = new Map(categories.map((c) => [c.id, c]))

  const [totals, spentByCategory] = await Promise.all([
    fetchMonthIncomeExpenseTotals(supabase, user.id, start, end),
    fetchExpenseSumByCategory(supabase, user.id, start, end),
  ])

  const monthIncome = totals.income
  const monthExpense = totals.expense
  const monthBalance = roundMoney(monthIncome - monthExpense)

  const pieData = [...spentByCategory.entries()]
    .map(([id, value]) => {
      const cat = categoryById.get(id)
      if (!cat || value <= 0) return null
      return { name: cat.name, value, color: cat.color }
    })
    .filter((row): row is { name: string, value: number, color: string } => row != null)

  const { data: recentData } = await supabase
    .from("transactions")
    .select(
      `
      id,
      amount,
      kind,
      note,
      occurred_at,
      category:categories ( name, color, icon, kind )
    `
    )
    .eq("user_id", user.id)
    .gte("occurred_at", start)
    .lte("occurred_at", end)
    .order("occurred_at", { ascending: false })
    .limit(8)

  const recent = (recentData ?? []) as unknown as RecentRow[]

  const [alerts, cardsResult] = await Promise.all([
    getBudgetAlertsForUser(),
    listCreditCardsForUser(),
  ])
  const creditCards = cardsResult.ok ? cardsResult.cards : []
  const sortedAlerts = [...alerts].sort((a, b) => {
    if (a.paymentDay !== b.paymentDay) return a.paymentDay - b.paymentDay
    const aCard = a.card?.last4 ?? ""
    const bCard = b.card?.last4 ?? ""
    if (aCard === bCard) return a.categoryName.localeCompare(b.categoryName)
    if (!aCard) return 1
    if (!bCard) return -1
    return aCard.localeCompare(bCard)
  })
  const expenseCategories = categories.filter((c) => c.kind === "expense")

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Heading>Resumen</Heading>
          <Text className="mt-1">
            {monthLabel(monthStart)} · balance y movimientos del mes en contexto
          </Text>
        </div>
        <WalletAppMonthSelect monthStart={monthStart} />
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <TransactionQuickForm categories={categories} monthStart={start} monthEnd={end} />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <MotionStatCard className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:col-span-2 lg:col-span-1">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Balance del mes
            </p>
            <p
              className={`mt-2 text-3xl font-semibold tabular-nums ${monthBalance >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-orange-600 dark:text-orange-400"}`}
            >
              {formatMoney(monthBalance)}
            </p>
          </MotionStatCard>
          <MotionStatCard className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Ingresos del mes
            </p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
              {formatMoney(monthIncome)}
            </p>
          </MotionStatCard>
          <MotionStatCard className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Gastos del mes
            </p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-orange-600 dark:text-orange-400">
              {formatMoney(monthExpense)}
            </p>
          </MotionStatCard>
        </div>
      </div>

      {alerts.length > 0 ? (
        <section
          className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6"
          aria-labelledby="budget-alerts-heading"
        >
          <Subheading id="budget-alerts-heading" level={2}>
            Presupuestos del mes
          </Subheading>
          <ul className="mt-4 divide-y divide-zinc-100 dark:divide-zinc-800">
            {sortedAlerts.map((a) => (
              <li key={a.budgetId} className="py-3 first:pt-0 last:pb-0">
                <BudgetMonthDisclosure
                  budget={a}
                  monthStart={start}
                  monthEnd={end}
                  categories={categories}
                  actions={
                    <>
                      <RegisterBudgetPaymentDialog
                        categoryId={a.categoryId}
                        categoryName={a.categoryName}
                        defaultAmount={remainingToPay(a.limit, a.spent)}
                        monthStart={start}
                        monthEnd={end}
                      />
                      <EditBudgetDialog
                        expenseCategories={expenseCategories}
                        creditCards={creditCards}
                        budget={{
                          budgetId: a.budgetId,
                          categoryId: a.categoryId,
                          categoryName: a.categoryName,
                          limit: a.limit,
                          paymentDay: a.paymentDay,
                          creditCardId: a.creditCardId,
                        }}
                      />
                    </>
                  }
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <section
          className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6"
          aria-labelledby="chart-bars-heading"
        >
          <Subheading id="chart-bars-heading" level={2}>
            Ingresos vs gastos
          </Subheading>
          <IncomeExpenseBars income={monthIncome} expense={monthExpense} />
        </section>
        <section
          className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6"
          aria-labelledby="chart-pie-heading"
        >
          <Subheading id="chart-pie-heading" level={2}>
            Gastos por categoría
          </Subheading>
          <ExpenseByCategoryChart data={pieData} />
        </section>
      </div>

      <section
        className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6"
        aria-labelledby="recent-heading"
      >
        <Subheading id="recent-heading" level={2}>
          Movimientos del mes
        </Subheading>
        {recent.length === 0 ? (
          <Text className="mt-4">
            No hay movimientos en {monthLabel(monthStart)}. Registrá un gasto o ingreso arriba o cambiá el mes.
          </Text>
        ) : (
          <ul className="mt-4 divide-y divide-zinc-100 dark:divide-zinc-800">
            {recent.map((t) => {
              const cat = t.category
              const isIncome = t.kind === "income"
              return (
                <li
                  key={t.id}
                  className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  {cat ? (
                    <span
                      className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800"
                      style={{ color: cat.color }}
                    >
                      <CategoryIcon name={cat.icon} className="size-5" />
                    </span>
                  ) : (
                    <span className="size-10 shrink-0 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {cat?.name ?? "Sin categoría"}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {formatDateEsSV(t.occurred_at)}
                      {t.note ? ` · ${t.note}` : ""}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-sm font-semibold tabular-nums ${isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-orange-600 dark:text-orange-400"}`}
                  >
                    {isIncome ? "+" : "-"}
                    {formatMoney(Number(t.amount))}
                  </span>
                  <DeleteTransactionButton id={t.id} />
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
