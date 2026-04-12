"use client"

import { Trash2 } from "lucide-react"
import { useTransition } from "react"
import { deleteBudget } from "@/app/(app)/actions/wallet-actions"

interface DeleteBudgetButtonProps {
  id: string
}

export const DeleteBudgetButton = ({ id }: DeleteBudgetButtonProps) => {
  const [pending, startTransition] = useTransition()

  const handleClick = () => {
    startTransition(async () => {
      await deleteBudget(id)
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="inline-flex size-10 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50 dark:hover:bg-red-950/40 dark:hover:text-red-400"
      aria-label="Eliminar presupuesto"
    >
      <Trash2 className="size-4" aria-hidden />
    </button>
  )
}
