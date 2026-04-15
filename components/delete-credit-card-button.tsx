"use client"

import { Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { deleteCreditCard } from "@/app/(app)/actions/credit-card-actions"

interface DeleteCreditCardButtonProps {
  id: string
}

export const DeleteCreditCardButton = ({ id }: DeleteCreditCardButtonProps) => {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleClick = () => {
    setError(null)
    startTransition(async () => {
      const res = await deleteCreditCard(id)
      if (res.error) {
        setError(res.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="inline-flex size-10 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50 dark:hover:bg-red-950/40 dark:hover:text-red-400"
        aria-label="Eliminar tarjeta"
      >
        <Trash2 className="size-4" aria-hidden />
      </button>
      {error ? (
        <p className="max-w-[12rem] text-right text-xs text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
