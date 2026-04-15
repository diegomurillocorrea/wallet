"use client"

import { Pencil, X } from "lucide-react"
import { useActionState, useEffect, useId, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { updateCreditCard } from "@/app/(app)/actions/credit-card-actions"
import type { ActionResult } from "@/app/(app)/actions/wallet-actions"
import { ExpiryMmYyInput } from "@/components/expiry-mm-yy-input"
import { Pan16Input } from "@/components/pan-16-input"
import { holderDisplayFull } from "@/lib/credit-card/format"
import type { CreditCardListItem } from "@/lib/types/wallet"

interface EditCreditCardDialogProps {
  card: CreditCardListItem
}

export const EditCreditCardDialog = ({ card }: EditCreditCardDialogProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const router = useRouter()
  const [formNonce, setFormNonce] = useState(0)

  const [state, formAction, pending] = useActionState(
    async (_: ActionResult | undefined, fd: FormData) => updateCreditCard(fd),
    undefined as ActionResult | undefined
  )

  useEffect(() => {
    if (!state?.success) return
    dialogRef.current?.close()
    router.refresh()
  }, [state?.success, router])

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
        aria-label={`Editar tarjeta terminada en ${card.last4}`}
        aria-haspopup="dialog"
      >
        <Pencil className="size-4" aria-hidden />
      </button>
      <dialog
        ref={dialogRef}
        className="fixed left-1/2 top-1/2 z-50 max-h-[min(90dvh,100%)] w-[min(100vw-2rem,26rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-0 text-zinc-900 shadow-xl backdrop:bg-black/50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
        aria-labelledby={titleId}
      >
        <div className="flex items-start justify-between gap-3 border-b border-zinc-200 px-4 py-4 dark:border-zinc-800 sm:px-6">
          <h2 id={titleId} className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Editar tarjeta
          </h2>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            aria-label="Cerrar"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
        <form key={formNonce} action={formAction} className="flex flex-col gap-4 px-4 pb-4 pt-4 sm:px-6 sm:pb-6">
          <input type="hidden" name="creditCardId" value={card.id} />
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Actual: •••• {card.last4} · vence {card.exp_label}
          </p>
          <div>
            <label htmlFor={`${titleId}-pan`} className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Nuevo número (opcional)
            </label>
            <Pan16Input
              id={`${titleId}-pan`}
              name="pan"
              initialValue=""
              placeholder="Dejar vacío para no cambiar"
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm tabular-nums dark:border-zinc-700 dark:bg-zinc-950"
            />
          </div>
          <div>
            <label
              htmlFor={`${titleId}-holder`}
              className="block text-xs font-medium text-zinc-500 dark:text-zinc-400"
            >
              Nombre del titular
            </label>
            <input
              id={`${titleId}-holder`}
              name="holderName"
              type="text"
              autoComplete="cc-name"
              required
              defaultValue={holderDisplayFull(card.holder_first_name, card.holder_last_name)}
              maxLength={120}
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </div>
          <div>
            <label htmlFor={`${titleId}-exp`} className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Vencimiento (MM/AA)
            </label>
            <ExpiryMmYyInput
              id={`${titleId}-exp`}
              name="expiry"
              required
              initialValue={card.exp_label}
              placeholder="MM/AA"
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm tabular-nums dark:border-zinc-700 dark:bg-zinc-950"
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
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="submit"
              disabled={pending}
              className="min-h-11 flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-50"
            >
              {pending ? "Guardando…" : "Guardar"}
            </button>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="min-h-11 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              Cerrar
            </button>
          </div>
        </form>
      </dialog>
    </>
  )
}
