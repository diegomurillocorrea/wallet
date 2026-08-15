"use client"

import { deleteBudget } from "@/app/(app)/actions/wallet-actions"
import { ConfirmDeleteButton } from "@/components/confirm-delete-button"

interface DeleteBudgetButtonProps {
  id: string
}

export const DeleteBudgetButton = ({ id }: DeleteBudgetButtonProps) => {
  const handleConfirm = async () => {
    await deleteBudget(id)
  }

  return (
    <ConfirmDeleteButton
      label="Eliminar presupuesto"
      title="Eliminar presupuesto"
      description="Se elimina el límite recurrente de esta categoría. El historial de gastos no se borra."
      onConfirm={handleConfirm}
    />
  )
}
