"use client"

import { deleteCategory } from "@/app/(app)/actions/wallet-actions"
import { ConfirmDeleteButton } from "@/components/confirm-delete-button"

interface DeleteCategoryButtonProps {
  id: string
}

export const DeleteCategoryButton = ({ id }: DeleteCategoryButtonProps) => {
  const handleConfirm = async () => {
    await deleteCategory(id)
  }

  return (
    <ConfirmDeleteButton
      label="Eliminar categoría"
      title="Eliminar categoría"
      description="Se quitará de tus listas. Los movimientos que ya la usaron quedan sin esa categoría."
      onConfirm={handleConfirm}
    />
  )
}
