"use client"

import { useActionState, useEffect, useId, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { createCreditCard } from "@/app/(app)/actions/credit-card-actions"
import type { ActionResult } from "@/app/(app)/actions/wallet-actions"
import { ExpiryMmYyInput } from "@/components/expiry-mm-yy-input"
import { Pan16Input } from "@/components/pan-16-input"

export const AddCreditCardForm = () => {
  const formId = useId()
  const router = useRouter()
  const [formFieldsKey, setFormFieldsKey] = useState(0)
  const [hideSuccessMessage, setHideSuccessMessage] = useState(false)
  const handledSuccessRef = useRef(false)
  const [state, formAction, pending] = useActionState(
    async (_: ActionResult | undefined, fd: FormData) => createCreditCard(fd),
    undefined as ActionResult | undefined
  )

  useEffect(() => {
    if (pending) {
      handledSuccessRef.current = false
      return
    }
    if (!state?.success) {
      setHideSuccessMessage(false)
      return
    }
    if (handledSuccessRef.current) return
    handledSuccessRef.current = true
    setFormFieldsKey((k) => k + 1)
    router.refresh()
    setHideSuccessMessage(false)
    const t = window.setTimeout(() => setHideSuccessMessage(true), 2600)
    return () => window.clearTimeout(t)
  }, [state, pending, router])

  const showSuccessBanner = Boolean(state?.success) && !hideSuccessMessage

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6"
    >
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Nueva tarjeta</h2>
      <div>
        <label
          htmlFor={`${formId}-pan`}
          className="block text-xs font-medium text-zinc-500 dark:text-zinc-400"
        >
          Número (16 dígitos)
        </label>
        <Pan16Input
          key={formFieldsKey}
          id={`${formId}-pan`}
          name="pan"
          required
          initialValue=""
          placeholder="0000 0000 0000 0000"
          className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm tabular-nums tracking-wide dark:border-zinc-700 dark:bg-zinc-950"
        />
      </div>
      <div>
        <label
          htmlFor={`${formId}-holder`}
          className="block text-xs font-medium text-zinc-500 dark:text-zinc-400"
        >
          Nombre del titular
        </label>
        <input
          key={formFieldsKey}
          id={`${formId}-holder`}
          name="holderName"
          type="text"
          autoComplete="cc-name"
          required
          maxLength={120}
          className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
      </div>
      <div>
        <label
          htmlFor={`${formId}-exp`}
          className="block text-xs font-medium text-zinc-500 dark:text-zinc-400"
        >
          Vencimiento (MM/AA)
        </label>
        <ExpiryMmYyInput
          key={formFieldsKey}
          id={`${formId}-exp`}
          name="expiry"
          required
          initialValue=""
          placeholder="MM/AA"
          className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm tabular-nums dark:border-zinc-700 dark:bg-zinc-950"
        />
      </div>
      {state?.error ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {state.error}
        </p>
      ) : null}
      {showSuccessBanner ? (
        <p className="text-sm text-emerald-600 dark:text-emerald-400" role="status">
          Tarjeta guardada.
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-50"
      >
        {pending ? "Guardando…" : "Guardar tarjeta"}
      </button>
    </form>
  )
}
