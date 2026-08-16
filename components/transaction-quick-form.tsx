"use client"

import { useActionState, useMemo, useState } from "react"
import { addTransaction, type ActionResult } from "@/app/(app)/actions/wallet-actions"
import { KindToggle } from "@/components/kind-toggle"
import { Button } from "@/components/ui/button"
import { ErrorMessage, Field, Label } from "@/components/ui/fieldset"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { clampIsoDateToRange } from "@/lib/dates/month"
import { todayInElSalvador } from "@/lib/dates/el-salvador"
import type { CategoryRow, TransactionKind } from "@/lib/types/wallet"

interface TransactionQuickFormProps {
  categories: CategoryRow[]
  /** Rango del mes en contexto: acota la fecha del movimiento */
  monthStart?: string
  monthEnd?: string
  /** Sin marco propio: el padre ya es una baldosa bento */
  embedded?: boolean
}

export const TransactionQuickForm = ({
  categories,
  monthStart,
  monthEnd,
  embedded = false,
}: TransactionQuickFormProps) => {
  const [kind, setKind] = useState<TransactionKind>("expense")
  const [state, formAction, pending] = useActionState(
    async (_: ActionResult | undefined, fd: FormData) => addTransaction(fd),
    undefined as ActionResult | undefined
  )

  const filtered = useMemo(
    () => categories.filter((c) => c.kind === kind),
    [categories, kind]
  )

  const constrainToMonth = Boolean(monthStart && monthEnd)

  const defaultDate = useMemo(() => {
    const today = todayInElSalvador()
    if (monthStart && monthEnd) return clampIsoDateToRange(today, monthStart, monthEnd)
    return today
  }, [monthStart, monthEnd])

  return (
    <section
      className={
        embedded
          ? ""
          : "bento-panel"
      }
      aria-labelledby="quick-add-heading"
    >
      <h2
        id="quick-add-heading"
        className="font-display text-2xl uppercase tracking-tight text-ink"
      >
        Registrar movimiento
      </h2>
      <p className="mt-1 text-sm text-ink/70">
        Gasto o ingreso en pocos segundos
        {constrainToMonth ? " · la fecha queda en el mes en contexto" : ""}.
      </p>

      <div className="mt-4">
        <KindToggle
          value={kind}
          onChange={setKind}
          label="Tipo de movimiento"
        />
      </div>

      <form action={formAction} className="mt-4 flex flex-col gap-4">
        <input type="hidden" name="kind" value={kind} />
        {constrainToMonth ? <input type="hidden" name="constrainToAppMonth" value="1" /> : null}

        <Field>
          <Label className="sr-only">Categoría</Label>
          <Select id="categoryId" name="categoryId" required>
            <option value="">Elegí categoría</option>
            {filtered.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field>
          <Label className="sr-only">Monto</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            required
            placeholder="Monto"
          />
        </Field>

        <Field>
          <Label className="sr-only">Nota</Label>
          <Input
            id="note"
            name="note"
            type="text"
            maxLength={500}
            placeholder="Nota (opcional)"
          />
        </Field>

        <Field>
          <Label>Fecha</Label>
          <Input
            id="occurredAt"
            name="occurredAt"
            type="date"
            defaultValue={defaultDate}
            min={monthStart}
            max={monthEnd}
            required
          />
        </Field>

        {state?.error ? <ErrorMessage>{state.error}</ErrorMessage> : null}
        {state?.success ? (
          <p className="text-sm text-emerald-600 dark:text-emerald-400" role="status">
            Movimiento guardado.
          </p>
        ) : null}

        <Button type="submit" color="emerald" disabled={pending || filtered.length === 0} className="w-full">
          {pending ? "Guardando…" : "Guardar"}
        </Button>
      </form>
    </section>
  )
}
