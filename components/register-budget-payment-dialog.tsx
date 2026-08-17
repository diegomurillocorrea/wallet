"use client"

import { BanknotesIcon } from "@heroicons/react/16/solid"
import { useRouter } from "next/navigation"
import { useActionState, useCallback, useEffect, useId, useMemo, useState, type ChangeEvent } from "react"
import { addTransaction, type ActionResult } from "@/app/(app)/actions/wallet-actions"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogTitle,
} from "@/components/ui/dialog"
import { ErrorMessage, Field, Label } from "@/components/ui/fieldset"
import { Input } from "@/components/ui/input"
import { clampIsoDateToRange } from "@/lib/dates/month"
import { todayInElSalvador } from "@/lib/dates/el-salvador"
import { formatMoney } from "@/lib/format/money"

type PaymentMode = "full" | "custom"

interface PaymentModeToggleProps {
  canPayFull: boolean
  value: PaymentMode
  onChange: (mode: PaymentMode) => void
}

const PaymentModeToggle = ({ canPayFull, value, onChange }: PaymentModeToggleProps) => {
  const handleSelectFull = () => {
    if (!canPayFull) return
    onChange("full")
  }

  const handleSelectCustom = () => {
    onChange("custom")
  }

  return (
    <div className="grid grid-cols-2 gap-2" role="tablist" aria-label="Monto del gasto">
      {value === "custom" ? (
        <Button
          type="button"
          role="tab"
          aria-selected
          color="emerald"
          onClick={handleSelectCustom}
          className="w-full"
        >
          Personalizado
        </Button>
      ) : (
        <Button
          type="button"
          role="tab"
          aria-selected={false}
          outline
          onClick={handleSelectCustom}
          className="w-full"
        >
          Personalizado
        </Button>
      )}
      {value === "full" ? (
        <Button
          type="button"
          role="tab"
          aria-selected
          color="emerald"
          disabled={!canPayFull}
          onClick={handleSelectFull}
          className="w-full"
        >
          Hasta el límite
        </Button>
      ) : (
        <Button
          type="button"
          role="tab"
          aria-selected={false}
          outline
          disabled={!canPayFull}
          onClick={handleSelectFull}
          className="w-full"
        >
          Hasta el límite
        </Button>
      )}
    </div>
  )
}

interface RegisterBudgetPaymentFormInnerProps {
  categoryId: string
  defaultAmount: number
  monthStart: string
  monthEnd: string
  formId: string
  onClose: () => void
  onSaved: () => void
}

const RegisterBudgetPaymentFormInner = ({
  categoryId,
  defaultAmount,
  monthStart,
  monthEnd,
  formId,
  onClose,
  onSaved,
}: RegisterBudgetPaymentFormInnerProps) => {
  const canPayFull = defaultAmount > 0
  const [mode, setMode] = useState<PaymentMode>("custom")
  const [customAmount, setCustomAmount] = useState("")
  const defaultOccurredAt = useMemo(
    () => clampIsoDateToRange(todayInElSalvador(), monthStart, monthEnd),
    [monthStart, monthEnd]
  )
  const fullAmount = canPayFull ? defaultAmount.toFixed(2) : ""
  const amountValue = mode === "full" ? fullAmount : customAmount

  const [state, formAction, pending] = useActionState(
    async (_: ActionResult | undefined, fd: FormData) => addTransaction(fd),
    undefined as ActionResult | undefined
  )

  useEffect(() => {
    if (!state?.success) return
    onSaved()
  }, [state?.success, onSaved])

  const handleSelectMode = (next: PaymentMode) => {
    setMode(next)
  }

  const handleCustomAmountChange = (event: ChangeEvent<HTMLInputElement>) => {
    setCustomAmount(event.target.value)
  }

  return (
    <>
      <form id={formId} action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="kind" value="expense" />
        <input type="hidden" name="categoryId" value={categoryId} />
        <input type="hidden" name="constrainToAppMonth" value="1" />
        <PaymentModeToggle canPayFull={canPayFull} value={mode} onChange={handleSelectMode} />
        <Field>
          <Label>Monto</Label>
          {mode === "full" ? (
            <>
              <p
                data-slot="control"
                className="glass-inset-dark rounded-xl px-3.5 py-2.5 font-display text-xl uppercase tracking-tight tabular-nums text-sand"
              >
                {formatMoney(defaultAmount)}
              </p>
              <input type="hidden" name="amount" value={fullAmount} />
            </>
          ) : (
            <Input
              id={`${formId}-amount`}
              name="amount"
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              required
              value={customAmount}
              onChange={handleCustomAmountChange}
              placeholder="0.00"
              autoComplete="transaction-amount"
            />
          )}
        </Field>
        <Field>
          <Label>Nota (opcional)</Label>
          <Input
            id={`${formId}-note`}
            name="note"
            type="text"
            maxLength={500}
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
            defaultValue={defaultOccurredAt}
          />
        </Field>
        {state?.error ? <ErrorMessage>{state.error}</ErrorMessage> : null}
      </form>
      <DialogActions>
        <Button type="button" plain onClick={onClose}>
          Cancelar
        </Button>
        <Button
          type="submit"
          form={formId}
          color="emerald"
          disabled={pending || amountValue === ""}
        >
          {pending ? "Guardando…" : "Registrar gasto"}
        </Button>
      </DialogActions>
    </>
  )
}

export interface RegisterBudgetPaymentDialogProps {
  categoryId: string
  categoryName: string
  defaultAmount: number
  monthStart: string
  monthEnd: string
}

export const RegisterBudgetPaymentDialog = ({
  categoryId,
  categoryName,
  defaultAmount,
  monthStart,
  monthEnd,
}: RegisterBudgetPaymentDialogProps) => {
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
        aria-label={`Registrar gasto en ${categoryName}`}
        aria-haspopup="dialog"
      >
        <BanknotesIcon />
      </Button>
      <Dialog open={open} onClose={handleCloseDialog} size="md">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sand/60">
          Registrar gasto
        </p>
        <DialogTitle className="mt-1">{categoryName}</DialogTitle>
        <DialogBody>
          <RegisterBudgetPaymentFormInner
            key={formNonce}
            categoryId={categoryId}
            defaultAmount={defaultAmount}
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
