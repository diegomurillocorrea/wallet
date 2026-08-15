"use client"

import { deleteTransaction } from "@/app/(app)/actions/wallet-actions"
import { ConfirmDeleteButton } from "@/components/confirm-delete-button"

interface DeleteTransactionButtonProps {
  id: string
}

export const DeleteTransactionButton = ({ id }: DeleteTransactionButtonProps) => {
  const handleConfirm = async () => {
    await deleteTransaction(id)
  }

  return (
    <ConfirmDeleteButton
      label="Eliminar movimiento"
      title="Eliminar movimiento"
      description="Esta acción no se puede deshacer."
      onConfirm={handleConfirm}
    />
  )
}
