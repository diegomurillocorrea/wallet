"use client"

import { useActionState, useEffect, useState } from "react"
import { addCategory, type ActionResult } from "@/app/(app)/actions/wallet-actions"
import { CategoryIconPicker } from "@/components/category-icon-picker"
import type { TransactionKind } from "@/lib/types/wallet"

export const AddCategoryForm = () => {
  const [kind, setKind] = useState<TransactionKind>("expense")
  const [iconPickerKey, setIconPickerKey] = useState(0)
  const [state, formAction, pending] = useActionState(
    async (_: ActionResult | undefined, fd: FormData) => addCategory(fd),
    undefined as ActionResult | undefined
  )

  useEffect(() => {
    if (state?.success) setIconPickerKey((k) => k + 1)
  }, [state?.success])

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6"
    >
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
        Nueva categoría
      </h2>
      <input type="hidden" name="kind" value={kind} />
      <div
        className="flex rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800"
        role="tablist"
        aria-label="Tipo de categoría"
      >
        {(
          [
            { k: "expense" as const, label: "Gasto" },
            { k: "income" as const, label: "Ingreso" },
          ] as const
        ).map(({ k, label }) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={kind === k}
            onClick={() => setKind(k)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
              kind === k
                ? "bg-white text-emerald-800 shadow-sm dark:bg-zinc-950 dark:text-emerald-300"
                : "text-zinc-600 dark:text-zinc-400"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div>
        <label htmlFor="add-cat-name" className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Nombre
        </label>
        <input
          id="add-cat-name"
          name="name"
          required
          maxLength={80}
          className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
      </div>
      <div>
        <label htmlFor="add-cat-color" className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Color
        </label>
        <input
          id="add-cat-color"
          name="color"
          type="color"
          defaultValue="#6366f1"
          className="mt-1 h-11 w-full cursor-pointer rounded-xl border border-zinc-200 bg-white dark:border-zinc-700"
        />
      </div>
      <div>
        <span className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">Ícono</span>
        <div className="mt-2">
          <CategoryIconPicker key={iconPickerKey} idPrefix="add-cat-icon" defaultIcon="circle" />
        </div>
      </div>
      {state?.error ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {state.error}
        </p>
      ) : null}
      {state?.success ? (
        <p className="text-sm text-emerald-600 dark:text-emerald-400" role="status">
          Categoría creada.
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-50"
      >
        {pending ? "Guardando…" : "Agregar categoría"}
      </button>
    </form>
  )
}
