"use client"

import { ChevronDownIcon } from "@heroicons/react/16/solid"
import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react"
import type { ReactNode } from "react"
import { CategoryIcon } from "@/components/category-icon"
import { DeleteTransactionButton } from "@/components/delete-transaction-button"
import { EditTransactionDialog } from "@/components/edit-transaction-dialog"
import { paymentDayLabel } from "@/lib/budgets/limits"
import { formatDateEsSV } from "@/lib/dates/el-salvador"
import { formatMoney } from "@/lib/format/money"
import type { BudgetAlertRow, CategoryRow } from "@/lib/types/wallet"

interface BudgetMonthDisclosureProps {
  budget: BudgetAlertRow
  monthStart: string
  monthEnd: string
  actions: ReactNode
  categories?: CategoryRow[]
}

const progressFillClass = (level: BudgetAlertRow["level"], spent: number, limit: number) => {
  if (level === "over" && spent !== limit) return "bg-red-500"
  if (level === "warn") return "bg-amber-500"
  return "bg-emerald-500"
}

const statusCopy = (budget: BudgetAlertRow) => {
  if (budget.level === "over" && budget.spent === budget.limit) return "Al límite"
  if (budget.level === "over") return "Sobre el límite"
  if (budget.level === "warn") return "Cerca del límite"
  return null
}

export const BudgetMonthDisclosure = ({
  budget,
  monthStart,
  monthEnd,
  actions,
  categories = [],
}: BudgetMonthDisclosureProps) => {
  const status = statusCopy(budget)
  const fillClass = progressFillClass(budget.level, budget.spent, budget.limit)
  const dayLabel = paymentDayLabel(monthStart, budget.paymentDay)

  return (
    <Disclosure as="div" className="py-1">
      <div className="flex items-start gap-3">
        <DisclosureButton
          className="group flex min-w-0 flex-1 items-start gap-3 rounded-xl text-left focus:outline-hidden data-focus:outline-2 data-focus:outline-offset-2 data-focus:outline-emerald-500"
          aria-label={`Ver movimientos de ${budget.categoryName}, ${formatMoney(budget.spent)} de ${formatMoney(budget.limit)}`}
        >
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800"
            style={{ color: budget.color }}
          >
            <CategoryIcon name={budget.icon} className="size-5" />
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex items-center gap-1">
              <span className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {budget.categoryName}
              </span>
              <ChevronDownIcon className="size-4 shrink-0 text-zinc-400 transition duration-200 group-data-open:rotate-180 dark:text-zinc-500" />
            </div>
            <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
              Día de pago <span className="tabular-nums">{dayLabel}</span>
              {budget.card ? (
                <>
                  <span className="text-zinc-300 dark:text-zinc-600"> · </span>
                  <span className="tabular-nums">•••• {budget.card.last4}</span>
                  <span> {budget.card.holderShort}</span>
                </>
              ) : null}
            </p>
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className={`h-full rounded-full ${fillClass}`}
                style={{ width: `${Math.min(100, budget.ratio * 100)}%` }}
              />
            </div>
            {status ? (
              <p
                className={`mt-1 text-[11px] font-medium ${
                  budget.level === "over" && budget.spent !== budget.limit
                    ? "text-red-600 dark:text-red-400"
                    : budget.level === "warn"
                      ? "text-amber-700 dark:text-amber-400"
                      : "text-emerald-700 dark:text-emerald-400"
                }`}
              >
                {status}
              </p>
            ) : null}
          </div>
        </DisclosureButton>
        <div className="flex shrink-0 items-center gap-0.5 pt-0.5">
          <span className="mr-1 text-sm tabular-nums text-zinc-600 dark:text-zinc-300">
            {formatMoney(budget.spent)}
            <span className="text-zinc-400 dark:text-zinc-500"> / {formatMoney(budget.limit)}</span>
          </span>
          {actions}
        </div>
      </div>

      <DisclosurePanel className="mt-3 border-t border-zinc-100 pt-2 dark:border-zinc-800">
        {budget.movements.length === 0 ? (
          <div className="flex items-center gap-3 py-2">
            <span className="size-10 shrink-0" aria-hidden="true" />
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Sin movimientos este mes.</p>
          </div>
        ) : (
          <ul>
            {budget.movements.map((movement) => (
              <li key={movement.id} className="flex items-center gap-3 py-2">
                <span className="size-10 shrink-0" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-zinc-800 dark:text-zinc-200">
                    {formatDateEsSV(movement.occurredAt)}
                  </p>
                  {movement.note ? (
                    <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{movement.note}</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                  <span className="mr-1 text-sm tabular-nums text-zinc-700 dark:text-zinc-200">
                    {formatMoney(movement.amount)}
                  </span>
                  <EditTransactionDialog
                    movement={{
                      ...movement,
                      categoryId: movement.categoryId ?? budget.categoryId,
                      kind: movement.kind ?? "expense",
                    }}
                    monthStart={monthStart}
                    monthEnd={monthEnd}
                    categories={categories}
                  />
                  <DeleteTransactionButton id={movement.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </DisclosurePanel>
    </Disclosure>
  )
}
