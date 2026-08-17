import { listCreditCardsForUser } from "@/app/(app)/actions/credit-card-actions"
import { getBudgetAlertsForUser } from "@/app/(app)/actions/wallet-actions"
import { ExpenseByCategoryChart } from "@/components/charts/expense-by-category-chart"
import { IncomeExpenseBars } from "@/components/charts/income-expense-bars"
import { CategoryIcon } from "@/components/category-icon"
import { EditBudgetDialog } from "@/components/edit-budget-dialog"
import { BudgetMonthDisclosure } from "@/components/budget-month-disclosure"
import { RegisterBudgetPaymentDialog } from "@/components/register-budget-payment-dialog"
import { DeleteTransactionButton } from "@/components/delete-transaction-button"
import { TransactionQuickForm } from "@/components/transaction-quick-form"
import { Subheading } from "@/components/ui/heading"
import { monthLabel } from "@/lib/dates/month"
import { formatDateEsSV } from "@/lib/dates/el-salvador"
import { getWalletAppMonthRange } from "@/lib/dates/wallet-app-month"
import { WalletAppMonthSelect } from "@/components/wallet-app-month-select"
import { formatMoney, remainingToPay, roundMoney } from "@/lib/format/money"
import { fetchExpenseSumByCategory, fetchMonthIncomeExpenseTotals } from "@/lib/budgets/spent"
import { createClient } from "@/lib/supabase/server"
import { BentoTile } from "@/components/bento-tile"
import { WallyMark } from "@/components/wally-mark"
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
  const periodLabel = monthLabel(monthStart)

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 lg:min-h-[calc(100svh-9.5rem)] lg:grid-cols-12 lg:grid-rows-[minmax(11rem,auto)_minmax(20rem,1fr)]">
        <BentoTile
          tone="paper"
          as="section"
          className="flex flex-col justify-between gap-6 lg:col-span-4"
        >
          <svg
            viewBox="0 0 48 36"
            className="size-10 text-ink"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M8 28c0-8.8 5.2-16 16-16V4C11.2 4 0 14.4 0 28c0 4.4 2.4 8 8 8 4.4 0 8-3.6 8-8s-3.6-8-8-8Zm24 0c0-8.8 5.2-16 16-16V4C35.2 4 24 14.4 24 28c0 4.4 2.4 8 8 8 4.4 0 8-3.6 8-8s-3.6-8-8-8Z"
              fill="currentColor"
            />
          </svg>
          <div>
            <h1 className="font-display text-sm uppercase leading-snug tracking-wide text-ink">
              Resumen · {periodLabel}. Balance y movimientos del mes en contexto.
            </h1>
            <div className="mt-4">
              <WalletAppMonthSelect monthStart={monthStart} />
            </div>
          </div>
        </BentoTile>

        <BentoTile
          tone="forest"
          as="section"
          className="flex min-h-[14rem] flex-col justify-between lg:col-span-8"
        >
          <WallyMark className="size-11" variant="butter" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sand/80">
              Gastos del mes
            </p>
            <p className="mt-2 font-display text-5xl uppercase leading-none tracking-tight text-sand sm:text-6xl lg:text-7xl">
              {formatMoney(monthExpense)}
            </p>
          </div>
        </BentoTile>

        <BentoTile
          tone="sand"
          as="section"
          className="relative min-h-[18rem] lg:col-span-4"
        >
          <p className="sr-only">Wally · balance del mes {formatMoney(monthBalance)}</p>
          <p
            aria-hidden
            className="absolute bottom-6 left-5 font-display text-6xl uppercase leading-none tracking-tight text-ink sm:text-7xl lg:text-8xl [writing-mode:vertical-rl] rotate-180"
          >
            Wally
          </p>
          <div className="absolute right-6 bottom-6 text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/70">
              Balance
            </p>
            <p className="mt-1 font-display text-3xl uppercase leading-none tracking-tight tabular-nums sm:text-4xl">
              {formatMoney(monthBalance)}
            </p>
          </div>
        </BentoTile>

        <BentoTile
          tone="paper"
          as="section"
          aria-labelledby="recent-heading"
          className="flex min-h-[18rem] flex-col lg:col-span-8"
        >
          <Subheading id="recent-heading" level={2}>
            Movimientos
          </Subheading>
          {recent.length === 0 ? (
            <p className="mt-6 text-sm uppercase tracking-wide text-ink/70">
              No hay movimientos en {periodLabel}. Registrá un gasto o ingreso abajo.
            </p>
          ) : (
            <ul className="mt-4 flex flex-1 flex-col justify-center divide-y divide-ink/12">
              {recent.map((t) => {
                const cat = t.category
                const isIncome = t.kind === "income"
                return (
                  <li
                    key={t.id}
                    className="glass-interactive -mx-2 flex items-center gap-3 rounded-2xl px-2 py-3 hover:bg-forest/6"
                  >
                    {cat ? (
                      <span
                        className="glass-chip flex size-10 shrink-0 items-center justify-center rounded-full"
                        style={{ color: cat.color }}
                      >
                        <CategoryIcon name={cat.icon} className="size-5" />
                      </span>
                    ) : (
                      <span className="size-10 shrink-0 rounded-full bg-ink/12" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold uppercase tracking-wide text-ink">
                        {cat?.name ?? "Sin categoría"}
                      </p>
                      <p className="text-xs uppercase tracking-wide text-ink/70">
                        {formatDateEsSV(t.occurred_at)}
                        {t.note ? ` · ${t.note}` : ""}
                      </p>
                    </div>
                    <span className="shrink-0 font-display text-sm uppercase tabular-nums text-ink">
                      {isIncome ? "+" : "−"}
                      {formatMoney(Number(t.amount))}
                    </span>
                    <DeleteTransactionButton id={t.id} />
                  </li>
                )
              })}
            </ul>
          )}
        </BentoTile>
      </div>

      <div className="grid gap-3 lg:grid-cols-12">
        <BentoTile tone="paper" className="lg:col-span-5">
          <TransactionQuickForm
            embedded
            categories={categories}
            monthStart={start}
            monthEnd={end}
          />
        </BentoTile>
        <BentoTile tone="ink" className="flex min-h-[12rem] flex-col justify-between lg:col-span-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sand/80">
            Ingresos del mes
          </p>
          <p className="font-display text-4xl uppercase leading-none tracking-tight tabular-nums text-sand sm:text-5xl">
            {formatMoney(monthIncome)}
          </p>
        </BentoTile>
        <BentoTile
          tone="paper"
          as="section"
          aria-labelledby="chart-bars-heading"
          className="lg:col-span-4"
        >
          <Subheading id="chart-bars-heading" level={2}>
            Ingresos vs gastos
          </Subheading>
          <IncomeExpenseBars income={monthIncome} expense={monthExpense} />
        </BentoTile>
      </div>

      {alerts.length > 0 ? (
        <BentoTile
          tone="paper"
          as="section"
          aria-labelledby="budget-alerts-heading"
        >
          <Subheading id="budget-alerts-heading" level={2}>
            Presupuestos del mes
          </Subheading>
          <ul className="mt-4 divide-y divide-ink/12">
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
        </BentoTile>
      ) : null}

      <BentoTile
        tone="paper"
        as="section"
        aria-labelledby="chart-pie-heading"
      >
        <Subheading id="chart-pie-heading" level={2}>
          Gastos por categoría
        </Subheading>
        <ExpenseByCategoryChart data={pieData} />
      </BentoTile>
    </div>
  )
}
