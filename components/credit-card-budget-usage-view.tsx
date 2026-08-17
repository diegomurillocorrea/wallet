"use client"

import Link from "next/link"
import { CategoryIcon } from "@/components/category-icon"
import { paymentDayLabel } from "@/lib/budgets/limits"
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
      <p className="bento-panel text-sm text-ink/70">
        No tenés tarjetas registradas.{" "}
        <Link
          href="/credit-cards"
          className="font-semibold text-emerald-700 underline decoration-emerald-700/40 underline-offset-2 transition-colors hover:decoration-emerald-700"
        >
          Agregá una tarjeta
        </Link>{" "}
        y vinculala desde Presupuestos.
      </p>
    )
  }

  return (
    <ul className="flex flex-col gap-3" aria-label="Presupuestos por tarjeta">
      {groups.map(({ card, budgets, totalSpentOnCard }) => (
        <li key={card.id} className="bento-panel">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-ink/12 pb-4">
            <div className="flex min-w-0 items-center gap-3">
              <span
                className="glass-chip flex size-10 shrink-0 items-center justify-center rounded-xl text-xs font-semibold tabular-nums text-emerald-700"
                aria-hidden
              >
                ••{card.last4}
              </span>
              <div className="min-w-0">
                <h2 className="font-display text-lg uppercase tracking-tight text-ink">
                  {holderDisplayFull(card.holder_first_name, card.holder_last_name)}
                </h2>
                <p className="text-xs text-ink/70">Vence {card.exp_label}</p>
              </div>
            </div>
            {budgets.length > 0 ? (
              <div className="max-w-xs shrink-0 text-right">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink/70">
                  Gasto en categorías ligadas
                </p>
                <p className="mt-1 font-display text-2xl uppercase leading-none tracking-tight tabular-nums text-ink">
                  {formatMoney(totalSpentOnCard)}
                </p>
                <p className="mt-1.5 text-xs text-ink/70">
                  Suma de gastos del mes en esas categorías (etiqueta de tarjeta, no saldo del plástico)
                </p>
              </div>
            ) : null}
          </div>

          {budgets.length === 0 ? (
            <p className="mt-4 text-sm text-ink/70">
              Ningún presupuesto usa esta tarjeta. Podés asignarla al crear o editar un presupuesto en{" "}
              <Link
                href="/budgets"
                className="font-semibold text-emerald-700 underline decoration-emerald-700/40 underline-offset-2 transition-colors hover:decoration-emerald-700"
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
                    className="glass-inset glass-interactive flex items-start gap-3 rounded-2xl px-3 py-3 hover:bg-forest/8"
                  >
                    <span
                      className="glass-chip flex size-10 shrink-0 items-center justify-center rounded-xl"
                      style={{ color: b.color }}
                    >
                      <CategoryIcon name={b.icon} className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink">{b.categoryName}</p>
                      <p className="mt-0.5 text-xs text-ink/70">
                        Techo en {monthLabel(b.monthStart)} · día de pago{" "}
                        {paymentDayLabel(b.monthStart, b.paymentDay)}
                      </p>
                      <p className="mt-1 text-xs tabular-nums text-ink/70">
                        <span className="font-semibold text-ink">
                          Gastado {formatMoney(b.spent)}
                        </span>
                        <span className="text-ink/70"> · Límite {formatMoney(b.amountLimit)}</span>
                      </p>
                      {b.amountLimit > 0 ? (
                        <div
                          className="mt-2 h-2 overflow-hidden rounded-full bg-ink/12 shadow-[inset_0_1px_1px_rgb(0_20_17/0.1)]"
                          role="progressbar"
                          aria-valuenow={Math.min(100, Math.round(ratio * 100))}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`Progreso de gasto en ${b.categoryName}`}
                        >
                          <div
                            className={`h-full rounded-full transition-[width] duration-300 ease-glass ${
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
