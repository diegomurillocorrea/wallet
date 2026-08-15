"use client"

import { useRouter } from "next/navigation"
import { deleteCreditCard } from "@/app/(app)/actions/credit-card-actions"
import { ConfirmDeleteButton } from "@/components/confirm-delete-button"

interface DeleteCreditCardButtonProps {
  id: string
}

export const DeleteCreditCardButton = ({ id }: DeleteCreditCardButtonProps) => {
  const router = useRouter()

  const handleConfirm = async () => {
    const res = await deleteCreditCard(id)
    if (res.error) return res.error
    router.refresh()
  }

  return (
    <ConfirmDeleteButton
      label="Eliminar tarjeta"
      title="Eliminar tarjeta"
      description="Si está vinculada a un presupuesto, primero desvinculala o el servidor te lo va a indicar."
      onConfirm={handleConfirm}
    />
  )
}
