"use client"

import { PencilIcon } from "@heroicons/react/16/solid"
import { useCallback, useRef, useState } from "react"
import { BudgetForm } from "@/components/budget-form"
import { BudgetMonthDisclosure } from "@/components/budget-month-disclosure"
import { DeleteBudgetButton } from "@/components/delete-budget-button"
import { RegisterBudgetPaymentDialog } from "@/components/register-budget-payment-dialog"
import { Button } from "@/components/ui/button"
import { Subheading } from "@/components/ui/heading"
import { Text } from "@/components/ui/text"
import { formatMoney, remainingToPay } from "@/lib/format/money"
import type { BudgetAlertRow, BudgetEditTarget, CategoryRow, CreditCardListItem } from "@/lib/types/wallet"

interface BudgetsWorkspaceProps {
  expenseCategories: CategoryRow[]
  creditCards: CreditCardListItem[]
  budgets: BudgetAlertRow[]
  defaultPaymentMonthStart: string
  defaultPaymentMonthEnd: string
  allCategories: CategoryRow[]
}

export const BudgetsWorkspace = ({
  expenseCategories,
  creditCards,
  budgets,
  defaultPaymentMonthStart,
  defaultPaymentMonthEnd,
  allCategories,
}: BudgetsWorkspaceProps) => {
  const [editTarget, setEditTarget] = useState<BudgetEditTarget | null>(null)
  const formAnchorRef = useRef<HTMLDivElement>(null)

  const totalBudgeted = budgets.reduce((sum, b) => sum + b.limit, 0)

  const sortedBudgets = [...budgets].sort((a, b) => {
    if (a.paymentDay !== b.paymentDay) return a.paymentDay - b.paymentDay
    const aCard = a.card?.last4 ?? ""
    const bCard = b.card?.last4 ?? ""
    if (aCard === bCard) return a.categoryName.localeCompare(b.categoryName)
    if (!aCard) return 1
    if (!bCard) return -1
    return aCard.localeCompare(bCard)
  })

  const handleCancelEdit = useCallback(() => {
    setEditTarget(null)
  }, [])

  const handleStartEdit = useCallback((b: BudgetAlertRow) => {
    setEditTarget({
      budgetId: b.budgetId,
      categoryId: b.categoryId,
      categoryName: b.categoryName,
      limit: b.limit,
      paymentDay: b.paymentDay,
      creditCardId: b.creditCardId,
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
          creditCards={creditCards}
          editTarget={editTarget}
          onCancelEdit={handleCancelEdit}
        />
      </div>

      <section
        className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6"
        aria-labelledby="budget-list-heading"
      >
          <Subheading id="budget-list-heading" level={2}>
          Avance vs el mes en contexto
        </Subheading>
        {budgets.length === 0 ? (
          <Text className="mt-4">
            Todavía no definiste presupuestos. Usá el formulario para agregar uno.
          </Text>
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
            <ul className="mt-4 divide-y divide-zinc-100 dark:divide-zinc-800">
            {sortedBudgets.map((b) => {
              const isRowEditing = editTarget?.budgetId === b.budgetId
              return (
                <li
                  key={b.budgetId}
                  className={`py-3 first:pt-0 last:pb-0 ${
                    isRowEditing ? "rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/30 dark:bg-emerald-500/10" : ""
                  }`}
                >
                  <BudgetMonthDisclosure
                    budget={b}
                    monthStart={defaultPaymentMonthStart}
                    monthEnd={defaultPaymentMonthEnd}
                    categories={allCategories}
                    actions={
                      <>
                        <RegisterBudgetPaymentDialog
                          categoryId={b.categoryId}
                          categoryName={b.categoryName}
                          defaultAmount={remainingToPay(b.limit, b.spent)}
                          monthStart={defaultPaymentMonthStart}
                          monthEnd={defaultPaymentMonthEnd}
                        />
                        <Button
                          plain
                          type="button"
                          onClick={() => handleStartEdit(b)}
                          disabled={expenseCategories.length === 0}
                          aria-label={`Editar presupuesto de ${b.categoryName} en el formulario`}
                          aria-pressed={isRowEditing}
                        >
                          <PencilIcon />
                        </Button>
                        <DeleteBudgetButton id={b.budgetId} />
                      </>
                    }
                  />
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
