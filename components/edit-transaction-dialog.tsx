"use client"

import { PencilIcon } from "@heroicons/react/16/solid"
import { useRouter } from "next/navigation"
import { useActionState, useCallback, useEffect, useId, useMemo, useState } from "react"
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
import { Select } from "@/components/ui/select"
import type { BudgetCategoryMovement, CategoryRow, TransactionKind } from "@/lib/types/wallet"

interface EditTransactionFormInnerProps {
  movement: BudgetCategoryMovement
  monthStart: string
  monthEnd: string
  categories: CategoryRow[]
  formId: string
  onClose: () => void
  onSaved: () => void
}

const EditTransactionFormInner = ({
  movement,
  monthStart,
  monthEnd,
  categories,
  formId,
  onClose,
  onSaved,
}: EditTransactionFormInnerProps) => {
  const kind: TransactionKind = movement.kind ?? "expense"
  const sameKind = useMemo(
    () => categories.filter((c) => c.kind === kind),
    [categories, kind]
  )

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
        {sameKind.length > 0 ? (
          <Field>
            <Label>Categoría</Label>
            <Select
              id={`${formId}-category`}
              name="categoryId"
              defaultValue={movement.categoryId ?? sameKind[0]?.id}
              required
            >
              {sameKind.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
        ) : null}
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
  categories?: CategoryRow[]
}

export const EditTransactionDialog = ({
  movement,
  monthStart,
  monthEnd,
  categories = [],
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
            categories={categories}
            formId={formId}
            onClose={handleCloseDialog}
            onSaved={handleSaved}
          />
        </DialogBody>
      </Dialog>
    </>
  )
}
