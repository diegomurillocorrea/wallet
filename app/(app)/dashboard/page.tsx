import { listCreditCardsForUser } from "@/app/(app)/actions/credit-card-actions"
import { getBudgetAlertsForUser } from "@/app/(app)/actions/wallet-actions"
import { ExpenseByCategoryChart } from "@/components/charts/expense-by-category-chart"
import { IncomeExpenseBars } from "@/components/charts/income-expense-bars"
import { CategoryIcon } from "@/components/category-icon"
import { EditBudgetDialog } from "@/components/edit-budget-dialog"
import { DeleteTransactionButton } from "@/components/delete-transaction-button"
import { MotionStatCard } from "@/components/motion-stat-card"
import { TransactionQuickForm } from "@/components/transaction-quick-form"
import { monthLabel } from "@/lib/dates/month"
import { getWalletAppMonthRange } from "@/lib/dates/wallet-app-month"
import { WalletAppMonthSelect } from "@/components/wallet-app-month-select"
import { formatMoney } from "@/lib/format/money"
import { createClient } from "@/lib/supabase/server"
import type { CategoryRow } from "@/lib/types/wallet"

interface MonthTxRow {
  amount: number | string
  kind: string
  category: { name: string, color: string } | null
}

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

  const { data: monthTxData } = await supabase
    .from("transactions")
    .select(
      `
      amount,
      kind,
      category:categories ( name, color )
    `
    )
    .eq("user_id", user.id)
    .gte("occurred_at", start)
    .lte("occurred_at", end)

  const monthTx = (monthTxData ?? []) as unknown as MonthTxRow[]

  let monthIncome = 0
  let monthExpense = 0
  const expenseByCat = new Map<string, { name: string, color: string, value: number }>()

  for (const t of monthTx) {
    const amt = Number(t.amount)
    if (t.kind === "income") {
      monthIncome += amt
      continue
    }
    monthExpense += amt
    const cat = t.category
    if (!cat) continue
    const key = cat.name
    const prev = expenseByCat.get(key) ?? { name: cat.name, color: cat.color, value: 0 }
    prev.value += amt
    expenseByCat.set(key, prev)
  }

  const monthBalance = monthIncome - monthExpense

  const pieData = [...expenseByCat.values()].map((c) => ({
    name: c.name,
    value: c.value,
    color: c.color,
  }))

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

  const [alerts, creditCards] = await Promise.all([getBudgetAlertsForUser(), listCreditCardsForUser()])
  const expenseCategories = categories.filter((c) => c.kind === "expense")

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Resumen
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {monthLabel(monthStart)} · balance y movimientos del mes en contexto
          </p>
        </div>
        <WalletAppMonthSelect monthStart={monthStart} />
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <TransactionQuickForm categories={categories} />

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
          <h2
            id="budget-alerts-heading"
            className="text-base font-semibold text-zinc-900 dark:text-zinc-100"
          >
            Presupuestos del mes
          </h2>
          <ul className="mt-4 flex flex-col gap-3">
            {alerts.map((a) => (
              <li key={a.budgetId}>
                <div className="flex items-center gap-3">
                  <span
                    className="flex size-10 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800"
                    style={{ color: a.color }}
                  >
                    <CategoryIcon name={a.icon} className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {a.categoryName}
                      </span>
                      <div className="flex shrink-0 items-center gap-0.5">
                        <span className="text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
                          {formatMoney(a.spent)} / {formatMoney(a.limit)}
                        </span>
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
                      </div>
                    </div>
                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                      Pago día <span className="tabular-nums">{a.paymentDay}</span>
                    </p>
                    {a.card ? (
                      <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-300">
                        <span className="rounded-md bg-zinc-200/80 px-1.5 py-0.5 font-medium tabular-nums dark:bg-zinc-800">
                          •••• {a.card.last4}
                        </span>{" "}
                        <span className="text-zinc-500 dark:text-zinc-400">{a.card.holderShort}</span>
                      </p>
                    ) : null}
                    <div
                      className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
                      role="progressbar"
                      aria-valuenow={Math.min(100, Math.round(a.ratio * 100))}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`Progreso de presupuesto ${a.categoryName}`}
                    >
                      <div
                        className={`h-full rounded-full transition-all ${
                          a.level === "over"
                            ? "bg-red-500"
                            : a.level === "warn"
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                        }`}
                        style={{ width: `${Math.min(100, a.ratio * 100)}%` }}
                      />
                    </div>
                    {a.level === "over" ? (
                      <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
                        Pasaste el límite de presupuesto.
                      </p>
                    ) : null}
                    {a.level === "warn" ? (
                      <p className="mt-1 text-xs font-medium text-amber-700 dark:text-amber-400">
                        Cerca del límite (80% o más).
                      </p>
                    ) : null}
                  </div>
                </div>
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
          <h2
            id="chart-bars-heading"
            className="text-base font-semibold text-zinc-900 dark:text-zinc-100"
          >
            Ingresos vs gastos
          </h2>
          <IncomeExpenseBars income={monthIncome} expense={monthExpense} />
        </section>
        <section
          className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6"
          aria-labelledby="chart-pie-heading"
        >
          <h2
            id="chart-pie-heading"
            className="text-base font-semibold text-zinc-900 dark:text-zinc-100"
          >
            Gastos por categoría
          </h2>
          <ExpenseByCategoryChart data={pieData} />
        </section>
      </div>

      <section
        className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6"
        aria-labelledby="recent-heading"
      >
        <h2
          id="recent-heading"
          className="text-base font-semibold text-zinc-900 dark:text-zinc-100"
        >
          Movimientos del mes
        </h2>
        {recent.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
            No hay movimientos en {monthLabel(monthStart)}. Registrá un gasto o ingreso arriba o cambiá el mes.
          </p>
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
                      {t.occurred_at}
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
