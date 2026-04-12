import { getBudgetAlertsForUser } from "@/app/(app)/actions/wallet-actions"
import { BudgetForm } from "@/components/budget-form"
import { CategoryIcon } from "@/components/category-icon"
import { DeleteBudgetButton } from "@/components/delete-budget-button"
import { currentMonthRange, monthLabel } from "@/lib/dates/month"
import { formatMoney } from "@/lib/format/money"
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

  const { monthStart } = currentMonthRange()
  const budgets = await getBudgetAlertsForUser()

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Presupuestos
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Límites por categoría · {monthLabel(monthStart)}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <BudgetForm expenseCategories={expenseCategories} />

        <section
          className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6"
          aria-labelledby="budget-list-heading"
        >
          <h2 id="budget-list-heading" className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Estado del mes
          </h2>
          {budgets.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
              Todavía no definiste presupuestos para este mes. Usá el formulario para agregar uno.
            </p>
          ) : (
            <ul className="mt-4 flex flex-col gap-4">
              {budgets.map((b) => (
                <li key={b.budgetId} className="flex items-start gap-3">
                  <span
                    className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800"
                    style={{ color: b.color }}
                  >
                    <CategoryIcon name={b.icon} className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {b.categoryName}
                      </span>
                      <DeleteBudgetButton id={b.budgetId} />
                    </div>
                    <p className="mt-0.5 text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
                      {formatMoney(b.spent)} de {formatMoney(b.limit)}
                    </p>
                    <div
                      className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
                      role="progressbar"
                      aria-valuenow={Math.min(100, Math.round(b.ratio * 100))}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className={`h-full rounded-full ${
                          b.level === "over"
                            ? "bg-red-500"
                            : b.level === "warn"
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                        }`}
                        style={{ width: `${Math.min(100, b.ratio * 100)}%` }}
                      />
                    </div>
                    {b.level === "over" ? (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">Sobre el límite</p>
                    ) : null}
                    {b.level === "warn" ? (
                      <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                        &gt; 80% del presupuesto
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
