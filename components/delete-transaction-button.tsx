"use client"

import { Trash2 } from "lucide-react"
import { useTransition } from "react"
import { deleteTransaction } from "@/app/(app)/actions/wallet-actions"

interface DeleteTransactionButtonProps {
  id: string
}

export const DeleteTransactionButton = ({ id }: DeleteTransactionButtonProps) => {
  const [pending, startTransition] = useTransition()

  const handleClick = () => {
    startTransition(async () => {
      await deleteTransaction(id)
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="inline-flex size-10 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50 dark:hover:bg-red-950/40 dark:hover:text-red-400"
      aria-label="Eliminar movimiento"
    >
      <Trash2 className="size-4" aria-hidden />
    </button>
  )
}
