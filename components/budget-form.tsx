"use client"

import { useActionState, useEffect, useId, useMemo } from "react"
import Link from "next/link"
import {
  updateBudget,
  upsertBudget,
  type ActionResult,
} from "@/app/(app)/actions/wallet-actions"
import { holderShortFromCard } from "@/lib/credit-card/format"
import { monthStartIso, paymentDateDefaultForMonth } from "@/lib/dates/month"
import type { BudgetEditTarget, CategoryRow, CreditCardListItem } from "@/lib/types/wallet"

const saveBudget = async (
  _: ActionResult | undefined,
  fd: FormData
): Promise<ActionResult> => {
  const raw = fd.get("budgetId")
  if (raw != null && String(raw).trim() !== "") return updateBudget(fd)
  return upsertBudget(fd)
}

interface BudgetFormProps {
  expenseCategories: CategoryRow[]
  creditCards: CreditCardListItem[]
  editTarget?: BudgetEditTarget | null
  onCancelEdit?: () => void
}

const creditOptionLabel = (c: CreditCardListItem): string =>
  `•••• ${c.last4} — ${holderShortFromCard(c.holder_first_name, c.holder_last_name)} · ${c.exp_label}`

export const BudgetForm = ({
  expenseCategories,
  creditCards,
  editTarget = null,
  onCancelEdit,
}: BudgetFormProps) => {
  const isEdit = editTarget != null
  const formId = useId()

  const defaultPaymentDate = useMemo(() => {
    const refMonth = monthStartIso(new Date())
    if (editTarget) {
      return paymentDateDefaultForMonth(refMonth, editTarget.paymentDay)
    }
    return paymentDateDefaultForMonth(refMonth, new Date().getDate())
  }, [editTarget])

  const [state, formAction, pending] = useActionState(saveBudget, undefined as ActionResult | undefined)

  useEffect(() => {
    if (!state?.success || !isEdit) return
    const t = window.setTimeout(() => {
      onCancelEdit?.()
    }, 450)
    return () => window.clearTimeout(t)
  }, [state?.success, isEdit, onCancelEdit])

  const handleClickCancelEdit = () => {
    onCancelEdit?.()
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6"
    >
      {isEdit ? <input type="hidden" name="budgetId" value={editTarget.budgetId} /> : null}
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
        {isEdit ? "Actualizar presupuesto" : "Definir o actualizar presupuesto"}
      </h2>
      {isEdit ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Estás editando <span className="font-medium text-zinc-700 dark:text-zinc-300">{editTarget.categoryName}</span>.
          El límite aplica todos los meses; el avance se compara con el mes elegido en Resumen.
        </p>
      ) : (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Límite recurrente por categoría de gasto. Si ya existe para esa categoría, se actualiza.
        </p>
      )}
      <div>
        <label
          htmlFor={`${formId}-budget-cat`}
          className="block text-xs font-medium text-zinc-500 dark:text-zinc-400"
        >
          Categoría
        </label>
        <select
          id={`${formId}-budget-cat`}
          name="categoryId"
          required
          defaultValue={isEdit ? editTarget.categoryId : undefined}
          className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        >
          {!isEdit ? <option value="">Elegí categoría de gasto</option> : null}
          {expenseCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label
          htmlFor={`${formId}-budget-limit`}
          className="block text-xs font-medium text-zinc-500 dark:text-zinc-400"
        >
          Límite (USD)
        </label>
        <input
          id={`${formId}-budget-limit`}
          name="amountLimit"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          required
          defaultValue={isEdit ? editTarget.limit : undefined}
          className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
      </div>
      <div>
        <label
          htmlFor={`${formId}-budget-payment-date`}
          className="block text-xs font-medium text-zinc-500 dark:text-zinc-400"
        >
          Día de pago
        </label>
        <input
          id={`${formId}-budget-payment-date`}
          name="paymentDate"
          type="date"
          required
          defaultValue={defaultPaymentDate}
          aria-describedby={`${formId}-budget-payment-date-hint`}
          className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
        <p id={`${formId}-budget-payment-date-hint`} className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Elegí una fecha: guardamos solo el día del mes (1 a 31) que cae en esa fecha.
        </p>
      </div>
      <div>
        <label
          htmlFor={`${formId}-budget-card`}
          className="block text-xs font-medium text-zinc-500 dark:text-zinc-400"
        >
          Tarjeta (opcional)
        </label>
        {creditCards.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            No tenés tarjetas registradas.{" "}
            <Link
              href="/credit-cards"
              className="font-medium text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
            >
              Cargá una en Tarjetas
            </Link>{" "}
            para vincularla al débito mensual.
          </p>
        ) : (
          <select
            id={`${formId}-budget-card`}
            name="creditCardId"
            defaultValue={isEdit && editTarget.creditCardId ? editTarget.creditCardId : ""}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            aria-describedby={`${formId}-budget-card-hint`}
          >
            <option value="">Sin tarjeta</option>
            {creditCards.map((c) => (
              <option key={c.id} value={c.id}>
                {creditOptionLabel(c)}
              </option>
            ))}
          </select>
        )}
        <p id={`${formId}-budget-card-hint`} className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Referencia para saber en qué plástico cae este presupuesto cada mes.
        </p>
      </div>
      {state?.error ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {state.error}
        </p>
      ) : null}
      {state?.success ? (
        <p className="text-sm text-emerald-600 dark:text-emerald-400" role="status">
          {isEdit ? "Cambios guardados." : "Presupuesto guardado."}
        </p>
      ) : null}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
        <button
          type="submit"
          disabled={pending || expenseCategories.length === 0}
          className="min-h-11 flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-50"
        >
          {pending ? "Guardando…" : isEdit ? "Guardar cambios" : "Guardar presupuesto"}
        </button>
        {isEdit ? (
          <button
            type="button"
            onClick={handleClickCancelEdit}
            className="min-h-11 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-800 sm:shrink-0"
          >
            Cancelar edición
          </button>
        ) : null}
      </div>
    </form>
  )
}
