"use client"

import { useActionState, useEffect, useId, useMemo } from "react"
import {
  updateBudget,
  upsertBudget,
  type ActionResult,
} from "@/app/(app)/actions/wallet-actions"
import { Button } from "@/components/ui/button"
import { Description, ErrorMessage, Field, Label } from "@/components/ui/fieldset"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Subheading } from "@/components/ui/heading"
import { Text, TextLink } from "@/components/ui/text"
import { holderShortFromCard } from "@/lib/credit-card/format"
import { monthStartIso, paymentDateDefaultForMonth } from "@/lib/dates/month"
import type { BudgetEditTarget, CategoryRow, CreditCardListItem } from "@/lib/types/wallet"

const saveBudget = async (
  _: ActionResult | undefined,
  fd: FormData
): Promise<ActionResult> => {
  const raw = fd.get("budgetId")
  if (raw != null && String(raw).trim() !== "") return updateBudget(fd)
  return upsertBudget(fd)
}

interface BudgetFormProps {
  expenseCategories: CategoryRow[]
  creditCards: CreditCardListItem[]
  editTarget?: BudgetEditTarget | null
  onCancelEdit?: () => void
}

const creditOptionLabel = (c: CreditCardListItem): string =>
  `•••• ${c.last4} — ${holderShortFromCard(c.holder_first_name, c.holder_last_name)} · ${c.exp_label}`

export const BudgetForm = ({
  expenseCategories,
  creditCards,
  editTarget = null,
  onCancelEdit,
}: BudgetFormProps) => {
  const isEdit = editTarget != null
  const formId = useId()

  const defaultPaymentDate = useMemo(() => {
    const refMonth = monthStartIso(new Date())
    if (editTarget) {
      return paymentDateDefaultForMonth(refMonth, editTarget.paymentDay)
    }
    return paymentDateDefaultForMonth(refMonth, new Date().getDate())
  }, [editTarget])

  const [state, formAction, pending] = useActionState(saveBudget, undefined as ActionResult | undefined)

  useEffect(() => {
    if (!state?.success || !isEdit) return
    const t = window.setTimeout(() => {
      onCancelEdit?.()
    }, 450)
    return () => window.clearTimeout(t)
  }, [state?.success, isEdit, onCancelEdit])

  const handleClickCancelEdit = () => {
    onCancelEdit?.()
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6"
    >
      {isEdit ? <input type="hidden" name="budgetId" value={editTarget.budgetId} /> : null}
      <Subheading level={2}>
        {isEdit ? "Actualizar presupuesto" : "Definir o actualizar presupuesto"}
      </Subheading>
      {isEdit ? (
        <Text>
          Estás editando <span className="font-medium text-zinc-700 dark:text-zinc-300">{editTarget.categoryName}</span>.
          El límite aplica todos los meses; el avance se compara con el mes elegido en Resumen.
        </Text>
      ) : (
        <Text>
          Límite recurrente por categoría de gasto. Si ya existe para esa categoría, se actualiza.
        </Text>
      )}
      <Field>
        <Label>Categoría</Label>
        <Select
          id={`${formId}-budget-cat`}
          name="categoryId"
          required
          defaultValue={isEdit ? editTarget.categoryId : undefined}
        >
          {!isEdit ? <option value="">Elegí categoría de gasto</option> : null}
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
          id={`${formId}-budget-limit`}
          name="amountLimit"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          required
          defaultValue={isEdit ? editTarget.limit : undefined}
        />
      </Field>
      <Field>
        <Label>Día de pago</Label>
        <Input
          id={`${formId}-budget-payment-date`}
          name="paymentDate"
          type="date"
          required
          defaultValue={defaultPaymentDate}
        />
        <Description>
          Elegí una fecha: guardamos solo el día del mes (1 a 31) que cae en esa fecha.
        </Description>
      </Field>
      <Field>
        <Label>Tarjeta (opcional)</Label>
        {creditCards.length === 0 ? (
          <Text>
            No tenés tarjetas registradas.{" "}
            <TextLink href="/credit-cards">Cargá una en Tarjetas</TextLink>{" "}
            para vincularla al débito mensual.
          </Text>
        ) : (
          <Select
            id={`${formId}-budget-card`}
            name="creditCardId"
            defaultValue={isEdit && editTarget.creditCardId ? editTarget.creditCardId : ""}
          >
            <option value="">Sin tarjeta</option>
            {creditCards.map((c) => (
              <option key={c.id} value={c.id}>
                {creditOptionLabel(c)}
              </option>
            ))}
          </Select>
        )}
        <Description>
          Referencia para saber en qué plástico cae este presupuesto cada mes.
        </Description>
      </Field>
      {state?.error ? <ErrorMessage>{state.error}</ErrorMessage> : null}
      {state?.success ? (
        <p className="text-sm text-emerald-600 dark:text-emerald-400" role="status">
          {isEdit ? "Cambios guardados." : "Presupuesto guardado."}
        </p>
      ) : null}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
        <Button
          type="submit"
          color="emerald"
          disabled={pending || expenseCategories.length === 0}
          className="w-full sm:flex-1"
        >
          {pending ? "Guardando…" : isEdit ? "Guardar cambios" : "Guardar presupuesto"}
        </Button>
        {isEdit ? (
          <Button type="button" outline onClick={handleClickCancelEdit}>
            Cancelar edición
          </Button>
        ) : null}
      </div>
    </form>
  )
}
