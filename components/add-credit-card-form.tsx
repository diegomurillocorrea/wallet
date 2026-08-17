"use client"

import { useActionState, useEffect, useId, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { createCreditCard } from "@/app/(app)/actions/credit-card-actions"
import type { ActionResult } from "@/app/(app)/actions/wallet-actions"
import { ExpiryMmYyInput } from "@/components/expiry-mm-yy-input"
import { Pan16Input } from "@/components/pan-16-input"
import { Button } from "@/components/ui/button"
import { ErrorMessage, Field, Label } from "@/components/ui/fieldset"
import { Input } from "@/components/ui/input"
import { Notice } from "@/components/ui/notice"
import { Subheading } from "@/components/ui/heading"

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

  /* eslint-disable react-hooks/set-state-in-effect -- sync form reset with useActionState */
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
  /* eslint-enable react-hooks/set-state-in-effect */

  const showSuccessBanner = Boolean(state?.success) && !hideSuccessMessage

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 bento-panel"
    >
      <Subheading level={2}>Nueva tarjeta</Subheading>
      <Field>
        <Label>Número (16 dígitos)</Label>
        <Pan16Input
          key={formFieldsKey}
          id={`${formId}-pan`}
          name="pan"
          required
          initialValue=""
          placeholder="0000 0000 0000 0000"
        />
      </Field>
      <Field>
        <Label>Nombre del titular</Label>
        <Input
          key={formFieldsKey}
          id={`${formId}-holder`}
          name="holderName"
          type="text"
          autoComplete="cc-name"
          required
          maxLength={120}
        />
      </Field>
      <Field>
        <Label>Vencimiento (MM/AA)</Label>
        <ExpiryMmYyInput
          key={formFieldsKey}
          id={`${formId}-exp`}
          name="expiry"
          required
          initialValue=""
          placeholder="MM/AA"
        />
      </Field>
      {state?.error ? <ErrorMessage>{state.error}</ErrorMessage> : null}
      {showSuccessBanner ? <Notice tone="success">Tarjeta guardada.</Notice> : null}
      <Button type="submit" color="emerald" disabled={pending} className="w-full">
        {pending ? "Guardando…" : "Guardar tarjeta"}
      </Button>
    </form>
  )
}
