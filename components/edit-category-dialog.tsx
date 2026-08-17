"use client"

import { PencilIcon } from "@heroicons/react/16/solid"
import { useActionState, useEffect, useState } from "react"
import { updateCategory, type ActionResult } from "@/app/(app)/actions/wallet-actions"
import { CategoryIconPicker } from "@/components/category-icon-picker"
import { KindToggle } from "@/components/kind-toggle"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogTitle,
} from "@/components/ui/dialog"
import { ErrorMessage, Field, Label } from "@/components/ui/fieldset"
import { Input } from "@/components/ui/input"
import { colorInputClass } from "@/components/ui/color-input"
import type { CategoryRow, TransactionKind } from "@/lib/types/wallet"

interface EditCategoryDialogProps {
  category: CategoryRow
}

interface EditCategoryFormFieldsProps {
  category: CategoryRow
  formKey: number
  onClose: () => void
}

const EditCategoryFormFields = ({ category, formKey, onClose }: EditCategoryFormFieldsProps) => {
  const [kind, setKind] = useState<TransactionKind>(category.kind)
  const formId = `edit-cat-form-${category.id}`

  const [state, formAction, pending] = useActionState(
    async (_: ActionResult | undefined, fd: FormData) => updateCategory(fd),
    undefined as ActionResult | undefined
  )

  useEffect(() => {
    if (!state?.success) return
    onClose()
  }, [state?.success, onClose])

  return (
    <>
      <DialogTitle>Editar categoría</DialogTitle>
      <DialogBody>
        <form id={formId} action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="id" value={category.id} />
          <input type="hidden" name="kind" value={kind} />
          <KindToggle value={kind} onChange={setKind} label="Tipo de categoría" />
          <Field>
            <Label>Nombre</Label>
            <Input
              id={`edit-cat-name-${category.id}`}
              name="name"
              required
              maxLength={80}
              defaultValue={category.name}
            />
          </Field>
          <Field>
            <Label>Color</Label>
            <input
              id={`edit-cat-color-${category.id}`}
              name="color"
              type="color"
              defaultValue={category.color}
              className={colorInputClass}
            />
          </Field>
          <div>
            <span className="text-base/6 font-medium text-zinc-950 sm:text-sm/6 dark:text-sand">
              Ícono
            </span>
            <div className="mt-3">
              <CategoryIconPicker
                key={`${category.id}-${formKey}`}
                idPrefix={`edit-cat-icon-${category.id}`}
                defaultIcon={category.icon}
              />
            </div>
          </div>
          {state?.error ? <ErrorMessage>{state.error}</ErrorMessage> : null}
        </form>
      </DialogBody>
      <DialogActions>
        <Button type="button" plain onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" form={formId} color="emerald" disabled={pending}>
          {pending ? "Guardando…" : "Guardar cambios"}
        </Button>
      </DialogActions>
    </>
  )
}

export const EditCategoryDialog = ({ category }: EditCategoryDialogProps) => {
  const [open, setOpen] = useState(false)
  const [formKey, setFormKey] = useState(0)

  const handleOpen = () => {
    setFormKey((k) => k + 1)
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
        onClick={handleOpen}
        aria-haspopup="dialog"
        aria-label={`Editar categoría ${category.name}`}
      >
        <PencilIcon />
      </Button>

      <Dialog open={open} onClose={handleClose} size="md">
        <EditCategoryFormFields
          key={formKey}
          category={category}
          formKey={formKey}
          onClose={handleClose}
        />
      </Dialog>
    </>
  )
}
