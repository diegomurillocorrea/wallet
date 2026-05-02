"use client"

import { Banknote } from "lucide-react"
import { useRouter } from "next/navigation"
import { useActionState, useCallback, useEffect, useId, useRef, useState } from "react"
import { addTransaction, type ActionResult } from "@/app/(app)/actions/wallet-actions"

interface RegisterBudgetPaymentFormInnerProps {
  categoryId: string
  categoryName: string
  defaultOccurredAt: string
  onSaved: () => void
}

const RegisterBudgetPaymentFormInner = ({
  categoryId,
  categoryName,
  defaultOccurredAt,
  onSaved,
}: RegisterBudgetPaymentFormInnerProps) => {
  const [state, formAction, pending] = useActionState(
    async (_: ActionResult | undefined, fd: FormData) => addTransaction(fd),
    undefined as ActionResult | undefined
  )
  const formId = useId()

  useEffect(() => {
    if (!state?.success) return
    onSaved()
  }, [state?.success, onSaved])

  return (
    <form id={formId} action={formAction} className="flex flex-col gap-3 px-4 pb-4 pt-0 sm:px-6 sm:pb-6">
      <input type="hidden" name="kind" value="expense" />
      <input type="hidden" name="categoryId" value={categoryId} />
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Se registrará un <span className="font-medium text-zinc-700 dark:text-zinc-300">gasto</span> en{" "}
        <span className="font-medium text-zinc-800 dark:text-zinc-200">{categoryName}</span>.
      </p>
      <div>
        <label htmlFor={`${formId}-amount`} className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Monto
        </label>
        <input
          id={`${formId}-amount`}
          name="amount"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          required
          placeholder="0.00"
          autoComplete="transaction-amount"
          className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
      </div>
      <div>
        <label htmlFor={`${formId}-note`} className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Nota (opcional)
        </label>
        <input
          id={`${formId}-note`}
          name="note"
          type="text"
          maxLength={500}
          placeholder="Ej. factura, comercio…"
          className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
      </div>
      <div>
        <label htmlFor={`${formId}-date`} className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Fecha del gasto
        </label>
        <input
          id={`${formId}-date`}
          name="occurredAt"
          type="date"
          required
          defaultValue={defaultOccurredAt}
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
          Pago registrado.
        </p>
      ) : null}
      <div className="mt-1 flex flex-wrap gap-2">
        <button
          type="submit"
          form={formId}
          disabled={pending}
          className="min-h-11 flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-50"
        >
          {pending ? "Guardando…" : "Registrar pago"}
        </button>
      </div>
    </form>
  )
}

export interface RegisterBudgetPaymentDialogProps {
  categoryId: string
  categoryName: string
  defaultOccurredAt: string
}

export const RegisterBudgetPaymentDialog = ({
  categoryId,
  categoryName,
  defaultOccurredAt,
}: RegisterBudgetPaymentDialogProps) => {
  const router = useRouter()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const [formNonce, setFormNonce] = useState(0)

  const handleCloseDialog = useCallback(() => {
    dialogRef.current?.close()
  }, [])

  const handleSaved = useCallback(() => {
    router.refresh()
    handleCloseDialog()
  }, [handleCloseDialog, router])

  const handleClickOpen = () => {
    setFormNonce((n) => n + 1)
    dialogRef.current?.showModal()
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClickOpen}
        className="inline-flex size-10 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        aria-label={`Registrar pago para ${categoryName}`}
        aria-haspopup="dialog"
      >
        <Banknote className="size-4" aria-hidden />
      </button>
      <dialog
        ref={dialogRef}
        className="fixed left-1/2 top-1/2 z-50 max-h-[min(90dvh,100%)] w-[min(100vw-2rem,26rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-0 text-zinc-900 shadow-xl backdrop:bg-black/50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
        aria-labelledby={titleId}
      >
        <div className="flex flex-col gap-1 border-b border-zinc-200 px-4 py-4 dark:border-zinc-800 sm:px-6">
          <h2 id={titleId} className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Registrar pago
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            El gasto cuenta para el mes que elegiste en Resumen (fecha del movimiento).
          </p>
        </div>
        <RegisterBudgetPaymentFormInner
          key={formNonce}
          categoryId={categoryId}
          categoryName={categoryName}
          defaultOccurredAt={defaultOccurredAt}
          onSaved={handleSaved}
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
