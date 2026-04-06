"use client"

import { useActionState, useMemo } from "react"
import { upsertBudget, type ActionResult } from "@/app/(app)/actions/wallet-actions"
import { monthStartIso } from "@/lib/dates/month"
import type { CategoryRow } from "@/lib/types/wallet"

interface BudgetFormProps {
  expenseCategories: CategoryRow[]
}

export const BudgetForm = ({ expenseCategories }: BudgetFormProps) => {
  const defaultMonth = useMemo(() => monthStartIso(new Date()), [])
  const [state, formAction, pending] = useActionState(
    async (_: ActionResult | undefined, fd: FormData) => upsertBudget(fd),
    undefined as ActionResult | undefined
  )

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-6"
    >
      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
        Definir o actualizar presupuesto
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Límite mensual por categoría de gasto. Si ya existe para el mes, se actualiza.
      </p>
      <div>
        <label htmlFor="budget-cat" className="block text-xs font-medium text-slate-500 dark:text-slate-400">
          Categoría
        </label>
        <select
          id="budget-cat"
          name="categoryId"
          required
          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950"
        >
          <option value="">Elegí categoría de gasto</option>
          {expenseCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="budget-limit" className="block text-xs font-medium text-slate-500 dark:text-slate-400">
          Límite (USD)
        </label>
        <input
          id="budget-limit"
          name="amountLimit"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          required
          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950"
        />
      </div>
      <div>
        <label htmlFor="budget-month" className="block text-xs font-medium text-slate-500 dark:text-slate-400">
          Mes (primer día)
        </label>
        <input
          id="budget-month"
          name="monthStart"
          type="date"
          defaultValue={defaultMonth}
          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950"
        />
      </div>
      {state?.error ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {state.error}
        </p>
      ) : null}
      {state?.success ? (
        <p className="text-sm text-emerald-600 dark:text-emerald-400" role="status">
          Presupuesto guardado.
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending || expenseCategories.length === 0}
        className="min-h-11 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-50"
      >
        {pending ? "Guardando…" : "Guardar presupuesto"}
      </button>
    </form>
  )
}
