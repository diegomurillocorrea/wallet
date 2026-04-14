"use client"

import { Pencil } from "lucide-react"
import { useActionState, useCallback, useEffect, useId, useRef, useState } from "react"
import { updateBudget, type ActionResult } from "@/app/(app)/actions/wallet-actions"
import { paymentDateDefaultForMonth } from "@/lib/dates/month"
import type { BudgetEditTarget, CategoryRow } from "@/lib/types/wallet"

/** @deprecated Usá BudgetEditTarget; se mantiene por compatibilidad con imports */
export type EditBudgetTarget = BudgetEditTarget

interface EditBudgetFormInnerProps {
  budget: BudgetEditTarget
  expenseCategories: CategoryRow[]
  onSaved: () => void
}

const EditBudgetFormInner = ({ budget, expenseCategories, onSaved }: EditBudgetFormInnerProps) => {
  const [state, formAction, pending] = useActionState(
    async (_: ActionResult | undefined, fd: FormData) => updateBudget(fd),
    undefined as ActionResult | undefined
  )
  const formId = useId()

  useEffect(() => {
    if (!state?.success) return
    onSaved()
  }, [state?.success, onSaved])

  return (
    <form id={formId} action={formAction} className="flex flex-col gap-3 px-4 pb-4 pt-0 sm:px-6 sm:pb-6">
      <input type="hidden" name="budgetId" value={budget.budgetId} />
      <div>
        <label
          htmlFor={`${formId}-cat`}
          className="block text-xs font-medium text-zinc-500 dark:text-zinc-400"
        >
          Categoría
        </label>
        <select
          id={`${formId}-cat`}
          name="categoryId"
          required
          defaultValue={budget.categoryId}
          className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        >
          {expenseCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label
          htmlFor={`${formId}-limit`}
          className="block text-xs font-medium text-zinc-500 dark:text-zinc-400"
        >
          Límite (USD)
        </label>
        <input
          id={`${formId}-limit`}
          name="amountLimit"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          required
          defaultValue={budget.limit}
          className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
      </div>
      <div>
        <label
          htmlFor={`${formId}-month`}
          className="block text-xs font-medium text-zinc-500 dark:text-zinc-400"
        >
          Mes (primer día)
        </label>
        <input
          id={`${formId}-month`}
          name="monthStart"
          type="date"
          required
          defaultValue={budget.monthStart.slice(0, 10)}
          className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
      </div>
      <div>
        <label
          htmlFor={`${formId}-pay`}
          className="block text-xs font-medium text-zinc-500 dark:text-zinc-400"
        >
          Día de pago
        </label>
        <input
          id={`${formId}-pay`}
          name="paymentDate"
          type="date"
          required
          defaultValue={paymentDateDefaultForMonth(budget.monthStart, budget.paymentDay)}
          className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
      </div>
      {state?.error ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {state.error}
        </p>
      ) : null}
      {state?.success ? (
        <p className="text-sm text-emerald-600 dark:text-emerald-400" role="status">
          Cambios guardados.
        </p>
      ) : null}
      <div className="mt-1 flex flex-wrap gap-2">
        <button
          type="submit"
          form={formId}
          disabled={pending || expenseCategories.length === 0}
          className="min-h-11 flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-50"
        >
          {pending ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>
    </form>
  )
}

interface EditBudgetDialogProps {
  expenseCategories: CategoryRow[]
  budget: BudgetEditTarget
}

export const EditBudgetDialog = ({ expenseCategories, budget }: EditBudgetDialogProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const [formNonce, setFormNonce] = useState(0)

  const handleCloseDialog = useCallback(() => {
    dialogRef.current?.close()
  }, [])

  const handleClickOpen = () => {
    setFormNonce((n) => n + 1)
    dialogRef.current?.showModal()
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClickOpen}
        disabled={expenseCategories.length === 0}
        className="inline-flex size-10 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-50 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        aria-label={`Editar presupuesto de ${budget.categoryName}`}
        aria-haspopup="dialog"
      >
        <Pencil className="size-4" aria-hidden />
      </button>
      <dialog
        ref={dialogRef}
        className="w-[min(100vw-2rem,26rem)] rounded-2xl border border-zinc-200 bg-white p-0 text-zinc-900 shadow-xl backdrop:bg-black/50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
        aria-labelledby={titleId}
      >
        <div className="flex flex-col gap-1 border-b border-zinc-200 px-4 py-4 dark:border-zinc-800 sm:px-6">
          <h2 id={titleId} className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Editar presupuesto
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Podés cambiar categoría, mes, límite y día de pago. Si movés el mes, este ítem puede dejar de verse en
            &quot;Estado del mes&quot; actual.
          </p>
        </div>
        <EditBudgetFormInner
          key={formNonce}
          budget={budget}
          expenseCategories={expenseCategories}
          onSaved={handleCloseDialog}
        />
        <div className="border-t border-zinc-200 px-4 py-3 dark:border-zinc-800 sm:px-6">
          <button
            type="button"
            onClick={handleCloseDialog}
            className="w-full min-h-11 rounded-xl border border-zinc-200 bg-white py-3 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Cancelar
          </button>
        </div>
      </dialog>
    </>
  )
}
