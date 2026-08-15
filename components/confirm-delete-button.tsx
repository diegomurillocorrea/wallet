"use client"

import { TrashIcon } from "@heroicons/react/16/solid"
import { useState, useTransition } from "react"
import {
  Alert,
  AlertActions,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

interface ConfirmDeleteButtonProps {
  label: string
  title: string
  description: string
  onConfirm: () => Promise<string | void>
}

export const ConfirmDeleteButton = ({
  label,
  title,
  description,
  onConfirm,
}: ConfirmDeleteButtonProps) => {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const handleOpen = () => {
    setError(null)
    setOpen(true)
  }

  const handleClose = () => {
    if (pending) return
    setOpen(false)
  }

  const handleConfirm = () => {
    setError(null)
    startTransition(async () => {
      const result = await onConfirm()
      if (typeof result === "string" && result.length > 0) {
        setError(result)
        return
      }
      setOpen(false)
    })
  }

  return (
    <>
      <Button plain type="button" onClick={handleOpen} aria-label={label}>
        <TrashIcon />
      </Button>
      <Alert open={open} onClose={handleClose}>
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{description}</AlertDescription>
        {error ? (
          <p className="mt-3 text-sm text-red-600 dark:text-red-500" role="alert">
            {error}
          </p>
        ) : null}
        <AlertActions>
          <Button plain type="button" onClick={handleClose} disabled={pending}>
            Cancelar
          </Button>
          <Button color="red" type="button" onClick={handleConfirm} disabled={pending}>
            {pending ? "Eliminando…" : "Eliminar"}
          </Button>
        </AlertActions>
      </Alert>
    </>
  )
}
