"use client"

import Link from "next/link"
import { CategoryIcon } from "@/components/category-icon"
import { holderDisplayFull } from "@/lib/credit-card/format"
import { monthLabel } from "@/lib/dates/month"
import { formatMoney } from "@/lib/format/money"
import type { CreditCardBudgetUsageGroup } from "@/lib/types/wallet"

interface CreditCardBudgetUsageViewProps {
  groups: CreditCardBudgetUsageGroup[]
}

export const CreditCardBudgetUsageView = ({ groups }: CreditCardBudgetUsageViewProps) => {
  if (groups.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        No tenés tarjetas registradas.{" "}
        <Link
          href="/credit-cards"
          className="font-medium text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
        >
          Agregá una tarjeta
        </Link>{" "}
        y vinculala desde Presupuestos.
      </p>
    )
  }

  return (
    <ul className="flex flex-col gap-6" aria-label="Presupuestos por tarjeta">
      {groups.map(({ card, budgets, totalSpentOnCard }) => (
        <li
          key={card.id}
          className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-100 pb-3 dark:border-zinc-800">
            <div className="flex min-w-0 items-center gap-3">
              <span
                className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-xs font-semibold tabular-nums text-emerald-700 dark:bg-zinc-800 dark:text-emerald-400"
                aria-hidden
              >
                ••{card.last4}
              </span>
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  {holderDisplayFull(card.holder_first_name, card.holder_last_name)}
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Vence {card.exp_label}</p>
              </div>
            </div>
            {budgets.length > 0 ? (
              <div className="shrink-0 text-right">
                <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Gastado acumulado
                </p>
                <p className="text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                  {formatMoney(totalSpentOnCard)}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Suma de tus movimientos en esas categorías</p>
              </div>
            ) : null}
          </div>

          {budgets.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
              Ningún presupuesto usa esta tarjeta. Podés asignarla al crear o editar un presupuesto en{" "}
              <Link
                href="/budgets"
                className="font-medium text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
              >
                Presupuestos
              </Link>
              .
            </p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {budgets.map((b) => {
                const ratio = b.amountLimit > 0 ? b.spent / b.amountLimit : 0
                const level =
                  ratio >= 1 ? "over" : ratio >= 0.8 ? "warn" : "ok"
                return (
                  <li
                    key={b.budgetId}
                    className="flex items-start gap-3 rounded-xl border border-zinc-100 bg-zinc-50/80 px-3 py-3 dark:border-zinc-800 dark:bg-zinc-950/50"
                  >
                    <span
                      className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white dark:bg-zinc-900"
                      style={{ color: b.color }}
                    >
                      <CategoryIcon name={b.icon} className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{b.categoryName}</p>
                      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                        {monthLabel(b.monthStart)} · día de pago {b.paymentDay}
                      </p>
                      <p className="mt-1 text-xs tabular-nums text-zinc-700 dark:text-zinc-200">
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">
                          Gastado {formatMoney(b.spent)}
                        </span>
                        <span className="text-zinc-500 dark:text-zinc-400"> · Límite {formatMoney(b.amountLimit)}</span>
                      </p>
                      {b.amountLimit > 0 ? (
                        <div
                          className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
                          role="progressbar"
                          aria-valuenow={Math.min(100, Math.round(ratio * 100))}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`Progreso de gasto en ${b.categoryName}`}
                        >
                          <div
                            className={`h-full rounded-full ${
                              level === "over"
                                ? "bg-red-500"
                                : level === "warn"
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                            }`}
                            style={{ width: `${Math.min(100, ratio * 100)}%` }}
                          />
                        </div>
                      ) : null}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </li>
      ))}
    </ul>
  )
}
