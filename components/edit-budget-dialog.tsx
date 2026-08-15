"use client"

import { PencilIcon } from "@heroicons/react/16/solid"
import { useActionState, useCallback, useEffect, useId, useState } from "react"
import { updateBudget, type ActionResult } from "@/app/(app)/actions/wallet-actions"
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
import { Select } from "@/components/ui/select"
import { Text, TextLink } from "@/components/ui/text"
import { holderShortFromCard } from "@/lib/credit-card/format"
import { monthStartIso, paymentDateDefaultForMonth } from "@/lib/dates/month"
import type { BudgetEditTarget, CategoryRow, CreditCardListItem } from "@/lib/types/wallet"

const creditOptionLabel = (c: CreditCardListItem): string =>
  `•••• ${c.last4} — ${holderShortFromCard(c.holder_first_name, c.holder_last_name)} · ${c.exp_label}`

/** @deprecated Usá BudgetEditTarget; se mantiene por compatibilidad con imports */
export type EditBudgetTarget = BudgetEditTarget

interface EditBudgetFormInnerProps {
  budget: BudgetEditTarget
  expenseCategories: CategoryRow[]
  creditCards: CreditCardListItem[]
  formId: string
  onSaved: () => void
}

const EditBudgetFormInner = ({
  budget,
  expenseCategories,
  creditCards,
  formId,
  onSaved,
}: EditBudgetFormInnerProps) => {
  const [state, formAction, pending] = useActionState(
    async (_: ActionResult | undefined, fd: FormData) => updateBudget(fd),
    undefined as ActionResult | undefined
  )

  useEffect(() => {
    if (!state?.success) return
    onSaved()
  }, [state?.success, onSaved])

  return (
    <>
      <form id={formId} action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="budgetId" value={budget.budgetId} />
        <Field>
          <Label>Categoría</Label>
          <Select id={`${formId}-cat`} name="categoryId" required defaultValue={budget.categoryId}>
            {expenseCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field>
          <Label>Límite (USD)</Label>
          <Input
            id={`${formId}-limit`}
            name="amountLimit"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            required
            defaultValue={budget.limit}
          />
        </Field>
        <Field>
          <Label>Día de pago</Label>
          <Input
            id={`${formId}-pay`}
            name="paymentDate"
            type="date"
            required
            defaultValue={paymentDateDefaultForMonth(monthStartIso(new Date()), budget.paymentDay)}
          />
        </Field>
        <Field>
          <Label>Tarjeta (opcional)</Label>
          {creditCards.length === 0 ? (
            <Text>
              <TextLink href="/credit-cards">Registrar tarjeta</TextLink> para vincularla.
            </Text>
          ) : (
            <Select
              id={`${formId}-card`}
              name="creditCardId"
              defaultValue={budget.creditCardId ?? ""}
            >
              <option value="">Sin tarjeta</option>
              {creditCards.map((c) => (
                <option key={c.id} value={c.id}>
                  {creditOptionLabel(c)}
                </option>
              ))}
            </Select>
          )}
        </Field>
        {state?.error ? <ErrorMessage>{state.error}</ErrorMessage> : null}
      </form>
      <DialogActions>
        <Button type="button" plain onClick={onSaved}>
          Cancelar
        </Button>
        <Button type="submit" form={formId} color="emerald" disabled={pending || expenseCategories.length === 0}>
          {pending ? "Guardando…" : "Guardar cambios"}
        </Button>
      </DialogActions>
    </>
  )
}

interface EditBudgetDialogProps {
  expenseCategories: CategoryRow[]
  creditCards: CreditCardListItem[]
  budget: BudgetEditTarget
}

export const EditBudgetDialog = ({ expenseCategories, creditCards, budget }: EditBudgetDialogProps) => {
  const formId = useId()
  const [open, setOpen] = useState(false)
  const [formNonce, setFormNonce] = useState(0)

  const handleCloseDialog = useCallback(() => {
    setOpen(false)
  }, [])

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
        disabled={expenseCategories.length === 0}
        aria-label={`Editar presupuesto de ${budget.categoryName}`}
        aria-haspopup="dialog"
      >
        <PencilIcon />
      </Button>
      <Dialog open={open} onClose={handleCloseDialog} size="md">
        <DialogTitle>Editar presupuesto</DialogTitle>
        <DialogDescription>
          Podés cambiar categoría, límite y día de pago. El avance se ve según el mes elegido en Resumen.
        </DialogDescription>
        <DialogBody>
          <EditBudgetFormInner
            key={formNonce}
            budget={budget}
            expenseCategories={expenseCategories}
            creditCards={creditCards}
            formId={formId}
            onSaved={handleCloseDialog}
          />
        </DialogBody>
      </Dialog>
    </>
  )
}
