"use client"

import { useActionState, useMemo, useState } from "react"
import { addTransaction, type ActionResult } from "@/app/(app)/actions/wallet-actions"
import type { CategoryRow } from "@/lib/types/wallet"
import type { TransactionKind } from "@/lib/types/wallet"

interface TransactionQuickFormProps {
  categories: CategoryRow[]
}

export const TransactionQuickForm = ({ categories }: TransactionQuickFormProps) => {
  const [kind, setKind] = useState<TransactionKind>("expense")
  const [state, formAction, pending] = useActionState(
    async (_: ActionResult | undefined, fd: FormData) => addTransaction(fd),
    undefined as ActionResult | undefined
  )

  const filtered = useMemo(
    () => categories.filter((c) => c.kind === kind),
    [categories, kind]
  )

  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])

  return (
    <section
      className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6"
      aria-labelledby="quick-add-heading"
    >
      <h2 id="quick-add-heading" className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
        Registrar movimiento
      </h2>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Gasto o ingreso en pocos segundos.
      </p>

      <div
        className="mt-4 flex rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800"
        role="tablist"
        aria-label="Tipo de movimiento"
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
            className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
              kind === k
                ? "bg-white text-emerald-800 shadow-sm dark:bg-zinc-950 dark:text-emerald-300"
                : "text-zinc-600 dark:text-zinc-400"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <form action={formAction} className="mt-4 flex flex-col gap-4">
        <input type="hidden" name="kind" value={kind} />

        <div>
          <label htmlFor="categoryId" className="sr-only">
            Categoría
          </label>
          <select
            id="categoryId"
            name="categoryId"
            required
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          >
            <option value="">Elegí categoría</option>
            {filtered.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="amount" className="sr-only">
            Monto
          </label>
          <input
            id="amount"
            name="amount"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            required
            placeholder="Monto"
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </div>

        <div>
          <label htmlFor="note" className="sr-only">
            Nota
          </label>
          <input
            id="note"
            name="note"
            type="text"
            maxLength={500}
            placeholder="Nota (opcional)"
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </div>

        <div>
          <label htmlFor="occurredAt" className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Fecha
          </label>
          <input
            id="occurredAt"
            name="occurredAt"
            type="date"
            defaultValue={today}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </div>

        {state?.error ? (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {state.error}
          </p>
        ) : null}
        {state?.success ? (
          <p className="text-sm text-emerald-600 dark:text-emerald-400" role="status">
            Movimiento guardado.
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending || filtered.length === 0}
          className="min-h-11 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Guardando…" : "Guardar"}
        </button>
      </form>
    </section>
  )
}
