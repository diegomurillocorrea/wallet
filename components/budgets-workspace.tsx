"use client"

import { Pencil } from "lucide-react"
import { useCallback, useRef, useState } from "react"
import { BudgetForm } from "@/components/budget-form"
import { CategoryIcon } from "@/components/category-icon"
import { DeleteBudgetButton } from "@/components/delete-budget-button"
import { monthLabel } from "@/lib/dates/month"
import { formatMoney } from "@/lib/format/money"
import type { BudgetAlertRow, BudgetEditTarget, CategoryRow } from "@/lib/types/wallet"

interface BudgetsWorkspaceProps {
  expenseCategories: CategoryRow[]
  budgets: BudgetAlertRow[]
}

export const BudgetsWorkspace = ({ expenseCategories, budgets }: BudgetsWorkspaceProps) => {
  const [editTarget, setEditTarget] = useState<BudgetEditTarget | null>(null)
  const formAnchorRef = useRef<HTMLDivElement>(null)

  const totalBudgeted = budgets.reduce((sum, b) => sum + b.limit, 0)

  const handleCancelEdit = useCallback(() => {
    setEditTarget(null)
  }, [])

  const handleStartEdit = useCallback((b: BudgetAlertRow) => {
    setEditTarget({
      budgetId: b.budgetId,
      categoryId: b.categoryId,
      categoryName: b.categoryName,
      limit: b.limit,
      monthStart: b.monthStart,
      paymentDay: b.paymentDay,
    })
    queueMicrotask(() => {
      formAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    })
  }, [])

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div ref={formAnchorRef}>
        <BudgetForm
          key={editTarget?.budgetId ?? "create"}
          expenseCategories={expenseCategories}
          editTarget={editTarget}
          onCancelEdit={handleCancelEdit}
        />
      </div>

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
          <>
            <div
              className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50"
              aria-label="Resumen de presupuestos del mes"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Total presupuestado
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                {formatMoney(totalBudgeted)}
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Suma de los límites en {budgets.length}{" "}
                {budgets.length === 1 ? "categoría" : "categorías"}
              </p>
            </div>
            <ul className="mt-4 flex flex-col gap-4">
            {budgets.map((b) => {
              const isRowEditing = editTarget?.budgetId === b.budgetId
              return (
                <li
                  key={b.budgetId}
                  className={`flex items-start gap-3 rounded-xl p-1 -m-1 transition-colors ${
                    isRowEditing ? "bg-emerald-500/10 ring-1 ring-emerald-500/30 dark:bg-emerald-500/10" : ""
                  }`}
                >
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
                      <div className="flex shrink-0 items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(b)}
                          disabled={expenseCategories.length === 0}
                          className="inline-flex size-10 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-50 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                          aria-label={`Editar presupuesto de ${b.categoryName} en el formulario`}
                          aria-pressed={isRowEditing}
                        >
                          <Pencil className="size-4" aria-hidden />
                        </button>
                        <DeleteBudgetButton id={b.budgetId} />
                      </div>
                    </div>
                    <time
                      className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400"
                      dateTime={b.monthStart}
                    >
                      Mes: {monthLabel(b.monthStart)}
                    </time>
                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                      Día de pago: <span className="tabular-nums">{b.paymentDay}</span> de cada mes
                    </p>
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
              )
            })}
          </ul>
          </>
        )}
      </section>
    </div>
  )
}
