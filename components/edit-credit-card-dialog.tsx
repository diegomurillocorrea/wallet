"use client"

import { PencilIcon } from "@heroicons/react/16/solid"
import { useActionState, useEffect, useId, useState } from "react"
import { useRouter } from "next/navigation"
import { updateCreditCard } from "@/app/(app)/actions/credit-card-actions"
import type { ActionResult } from "@/app/(app)/actions/wallet-actions"
import { ExpiryMmYyInput } from "@/components/expiry-mm-yy-input"
import { Pan16Input } from "@/components/pan-16-input"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { ErrorMessage, Field, Label } from "@/components/ui/fieldset"
import { Input } from "@/components/ui/input"
import { holderDisplayFull } from "@/lib/credit-card/format"
import type { CreditCardListItem } from "@/lib/types/wallet"

interface EditCreditCardDialogProps {
  card: CreditCardListItem
}

export const EditCreditCardDialog = ({ card }: EditCreditCardDialogProps) => {
  const titleId = useId()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [formNonce, setFormNonce] = useState(0)
  const formId = `${titleId}-form`

  const [state, formAction, pending] = useActionState(
    async (_: ActionResult | undefined, fd: FormData) => updateCreditCard(fd),
    undefined as ActionResult | undefined
  )

  /* eslint-disable react-hooks/set-state-in-effect -- close after server action */
  useEffect(() => {
    if (!state?.success) return
    setOpen(false)
    router.refresh()
  }, [state?.success, router])
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleClickOpen = () => {
    setFormNonce((n) => n + 1)
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
  }

  return (
    <>
      <Button
        plain
        type="button"
        onClick={handleClickOpen}
        aria-label={`Editar tarjeta terminada en ${card.last4}`}
        aria-haspopup="dialog"
      >
        <PencilIcon />
      </Button>
      <Dialog open={open} onClose={handleClose} size="md">
        <DialogTitle>Editar tarjeta</DialogTitle>
        <DialogDescription>
          Actual: •••• {card.last4} · vence {card.exp_label}
        </DialogDescription>
        <DialogBody>
          <form key={formNonce} id={formId} action={formAction} className="flex flex-col gap-4">
            <input type="hidden" name="creditCardId" value={card.id} />
            <Field>
              <Label>Nuevo número (opcional)</Label>
              <Pan16Input
                id={`${titleId}-pan`}
                name="pan"
                initialValue=""
                placeholder="Dejar vacío para no cambiar"
              />
            </Field>
            <Field>
              <Label>Nombre del titular</Label>
              <Input
                id={`${titleId}-holder`}
                name="holderName"
                type="text"
                autoComplete="cc-name"
                required
                defaultValue={holderDisplayFull(card.holder_first_name, card.holder_last_name)}
                maxLength={120}
              />
            </Field>
            <Field>
              <Label>Vencimiento (MM/AA)</Label>
              <ExpiryMmYyInput
                id={`${titleId}-exp`}
                name="expiry"
                required
                initialValue={card.exp_label}
                placeholder="MM/AA"
              />
            </Field>
            {state?.error ? <ErrorMessage>{state.error}</ErrorMessage> : null}
          </form>
        </DialogBody>
        <DialogActions>
          <Button type="button" plain onClick={handleClose}>
            Cerrar
          </Button>
          <Button type="submit" form={formId} color="emerald" disabled={pending}>
            {pending ? "Guardando…" : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
