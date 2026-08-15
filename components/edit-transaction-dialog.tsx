"use client"

import { PencilIcon } from "@heroicons/react/16/solid"
import { useRouter } from "next/navigation"
import { useActionState, useCallback, useEffect, useId, useState } from "react"
import { updateTransaction, type ActionResult } from "@/app/(app)/actions/wallet-actions"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogTitle,
} from "@/components/ui/dialog"
import { ErrorMessage, Field, Label } from "@/components/ui/fieldset"
import { Input } from "@/components/ui/input"
import type { BudgetCategoryMovement } from "@/lib/types/wallet"

interface EditTransactionFormInnerProps {
  movement: BudgetCategoryMovement
  monthStart: string
  monthEnd: string
  formId: string
  onClose: () => void
  onSaved: () => void
}

const EditTransactionFormInner = ({
  movement,
  monthStart,
  monthEnd,
  formId,
  onClose,
  onSaved,
}: EditTransactionFormInnerProps) => {
  const [state, formAction, pending] = useActionState(
    async (_: ActionResult | undefined, fd: FormData) => updateTransaction(fd),
    undefined as ActionResult | undefined
  )

  useEffect(() => {
    if (!state?.success) return
    onSaved()
  }, [state?.success, onSaved])

  return (
    <>
      <form id={formId} action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="transactionId" value={movement.id} />
        <input type="hidden" name="constrainToAppMonth" value="1" />
        <Field>
          <Label>Monto</Label>
          <Input
            id={`${formId}-amount`}
            name="amount"
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            required
            defaultValue={movement.amount.toFixed(2)}
            autoComplete="transaction-amount"
          />
        </Field>
        <Field>
          <Label>Nota (opcional)</Label>
          <Input
            id={`${formId}-note`}
            name="note"
            type="text"
            maxLength={500}
            defaultValue={movement.note ?? ""}
            placeholder="Ej. factura, comercio…"
          />
        </Field>
        <Field>
          <Label>Fecha</Label>
          <Input
            id={`${formId}-date`}
            name="occurredAt"
            type="date"
            required
            min={monthStart}
            max={monthEnd}
            defaultValue={movement.occurredAt}
          />
        </Field>
        {state?.error ? <ErrorMessage>{state.error}</ErrorMessage> : null}
      </form>
      <DialogActions>
        <Button type="button" plain onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" form={formId} color="emerald" disabled={pending}>
          {pending ? "Guardando…" : "Guardar"}
        </Button>
      </DialogActions>
    </>
  )
}

interface EditTransactionDialogProps {
  movement: BudgetCategoryMovement
  monthStart: string
  monthEnd: string
}

export const EditTransactionDialog = ({
  movement,
  monthStart,
  monthEnd,
}: EditTransactionDialogProps) => {
  const router = useRouter()
  const formId = useId()
  const [open, setOpen] = useState(false)
  const [formNonce, setFormNonce] = useState(0)

  const handleCloseDialog = useCallback(() => {
    setOpen(false)
  }, [])

  const handleSaved = useCallback(() => {
    router.refresh()
    handleCloseDialog()
  }, [handleCloseDialog, router])

  const handleClickOpen = () => {
    setFormNonce((n) => n + 1)
    setOpen(true)
  }

  return (
    <>
      <Button
        plain
        type="button"
        onClick={handleClickOpen}
        aria-label="Editar movimiento"
        aria-haspopup="dialog"
      >
        <PencilIcon />
      </Button>
      <Dialog open={open} onClose={handleCloseDialog} size="md">
        <DialogTitle>Editar movimiento</DialogTitle>
        <DialogBody>
          <EditTransactionFormInner
            key={formNonce}
            movement={movement}
            monthStart={monthStart}
            monthEnd={monthEnd}
            formId={formId}
            onClose={handleCloseDialog}
            onSaved={handleSaved}
          />
        </DialogBody>
      </Dialog>
    </>
  )
}
