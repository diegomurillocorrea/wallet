"use client"

import { useActionState, useState } from "react"
import { addCategory, type ActionResult } from "@/app/(app)/actions/wallet-actions"
import { CategoryIconPicker } from "@/components/category-icon-picker"
import { KindToggle } from "@/components/kind-toggle"
import { Button } from "@/components/ui/button"
import { ErrorMessage, Field, Label } from "@/components/ui/fieldset"
import { Input } from "@/components/ui/input"
import { Subheading } from "@/components/ui/heading"
import type { TransactionKind } from "@/lib/types/wallet"

const colorInputClass =
  "mt-3 h-11 w-full cursor-pointer rounded-lg border border-zinc-950/10 bg-transparent dark:border-white/10 dark:bg-white/5"

export const AddCategoryForm = () => {
  const [kind, setKind] = useState<TransactionKind>("expense")
  const [iconPickerKey, setIconPickerKey] = useState(0)
  const [state, formAction, pending] = useActionState(
    async (_: ActionResult | undefined, fd: FormData) => {
      const result = await addCategory(fd)
      if (result.success) setIconPickerKey((k) => k + 1)
      return result
    },
    undefined as ActionResult | undefined
  )

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6"
    >
      <Subheading level={2}>Nueva categoría</Subheading>
      <input type="hidden" name="kind" value={kind} />
      <KindToggle value={kind} onChange={setKind} label="Tipo de categoría" />
      <Field>
        <Label>Nombre</Label>
        <Input id="add-cat-name" name="name" required maxLength={80} />
      </Field>
      <Field>
        <Label>Color</Label>
        <input
          id="add-cat-color"
          name="color"
          type="color"
          defaultValue="#013e37"
          className={colorInputClass}
        />
      </Field>
      <div>
        <span className="text-base/6 font-medium text-zinc-950 sm:text-sm/6 dark:text-white">
          Ícono
        </span>
        <div className="mt-3">
          <CategoryIconPicker key={iconPickerKey} idPrefix="add-cat-icon" defaultIcon="circle" />
        </div>
      </div>
      {state?.error ? <ErrorMessage>{state.error}</ErrorMessage> : null}
      {state?.success ? (
        <p className="text-sm text-emerald-600 dark:text-emerald-400" role="status">
          Categoría creada.
        </p>
      ) : null}
      <Button type="submit" color="emerald" disabled={pending} className="w-full">
        {pending ? "Guardando…" : "Agregar categoría"}
      </Button>
    </form>
  )
}
