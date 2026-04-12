"use client"

import { Pencil, X } from "lucide-react"
import { useActionState, useEffect, useRef, useState } from "react"
import { updateCategory, type ActionResult } from "@/app/(app)/actions/wallet-actions"
import { CategoryIconPicker } from "@/components/category-icon-picker"
import type { CategoryRow, TransactionKind } from "@/lib/types/wallet"

interface EditCategoryDialogProps {
  category: CategoryRow
}

interface EditCategoryFormFieldsProps {
  category: CategoryRow
  dialogRef: React.RefObject<HTMLDialogElement | null>
  formKey: number
}

const EditCategoryFormFields = ({ category, dialogRef, formKey }: EditCategoryFormFieldsProps) => {
  const titleId = `edit-cat-title-${category.id}`
  const [kind, setKind] = useState<TransactionKind>(category.kind)

  const [state, formAction, pending] = useActionState(
    async (_: ActionResult | undefined, fd: FormData) => updateCategory(fd),
    undefined as ActionResult | undefined
  )

  useEffect(() => {
    setKind(category.kind)
  }, [category.kind, category.id, formKey])

  useEffect(() => {
    if (!state?.success) return
    dialogRef.current?.close()
  }, [state?.success, dialogRef])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <h2 id={titleId} className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Editar categoría
        </h2>
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          className="rounded-lg px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          aria-label="Cerrar"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="id" value={category.id} />
        <input type="hidden" name="kind" value={kind} />
        <div
          className="flex rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800"
          role="tablist"
          aria-label="Tipo de categoría"
        >
          {(
            [
              { k: "expense" as const, label: "Gasto" },
              { k: "income" as const, label: "Ingreso" },
            ] as const
          ).map(({ k, label }) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={kind === k}
              onClick={() => setKind(k)}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                kind === k
                  ? "bg-white text-emerald-800 shadow-sm dark:bg-zinc-950 dark:text-emerald-300"
                  : "text-zinc-600 dark:text-zinc-400"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div>
          <label
            htmlFor={`edit-cat-name-${category.id}`}
            className="block text-xs font-medium text-zinc-500 dark:text-zinc-400"
          >
            Nombre
          </label>
          <input
            id={`edit-cat-name-${category.id}`}
            name="name"
            required
            maxLength={80}
            defaultValue={category.name}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>

        <div>
          <label
            htmlFor={`edit-cat-color-${category.id}`}
            className="block text-xs font-medium text-zinc-500 dark:text-zinc-400"
          >
            Color
          </label>
          <input
            id={`edit-cat-color-${category.id}`}
            name="color"
            type="color"
            defaultValue={category.color}
            className="mt-1 h-11 w-full cursor-pointer rounded-xl border border-zinc-200 bg-white dark:border-zinc-700"
          />
        </div>

        <div>
          <span className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">Ícono</span>
          <div className="mt-2">
            <CategoryIconPicker
              key={`${category.id}-${formKey}`}
              idPrefix={`edit-cat-icon-${category.id}`}
              defaultIcon={category.icon}
            />
          </div>
        </div>

        {state?.error ? (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {state.error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="submit"
            disabled={pending}
            className="min-h-11 flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50"
          >
            {pending ? "Guardando…" : "Guardar cambios"}
          </button>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="min-h-11 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}

export const EditCategoryDialog = ({ category }: EditCategoryDialogProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [formKey, setFormKey] = useState(0)

  const handleOpen = () => {
    setFormKey((k) => k + 1)
    dialogRef.current?.showModal()
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex size-10 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        aria-haspopup="dialog"
        aria-controls={`edit-cat-dialog-${category.id}`}
        aria-label={`Editar categoría ${category.name}`}
      >
        <Pencil className="size-4" aria-hidden />
      </button>

      <dialog
        ref={dialogRef}
        id={`edit-cat-dialog-${category.id}`}
        className="fixed left-1/2 top-1/2 z-50 max-h-[min(90vh,40rem)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl backdrop:bg-zinc-950/60 dark:border-zinc-800 dark:bg-zinc-900"
        aria-labelledby={`edit-cat-title-${category.id}`}
      >
        <EditCategoryFormFields key={formKey} category={category} dialogRef={dialogRef} formKey={formKey} />
      </dialog>
    </>
  )
}
