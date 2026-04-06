"use client"

import { Trash2 } from "lucide-react"
import { useTransition } from "react"
import { deleteCategory } from "@/app/(app)/actions/wallet-actions"

interface DeleteCategoryButtonProps {
  id: string
  isSystem: boolean
}

export const DeleteCategoryButton = ({ id, isSystem }: DeleteCategoryButtonProps) => {
  const [pending, startTransition] = useTransition()

  if (isSystem) return null

  const handleClick = () => {
    startTransition(async () => {
      await deleteCategory(id)
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="inline-flex size-10 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50 dark:hover:bg-red-950/40 dark:hover:text-red-400"
      aria-label="Eliminar categoría"
    >
      <Trash2 className="size-4" aria-hidden />
    </button>
  )
}
