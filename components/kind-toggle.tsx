"use client"

import { Button } from "@/components/ui/button"
import type { TransactionKind } from "@/lib/types/wallet"

interface KindToggleProps {
  value: TransactionKind
  onChange: (kind: TransactionKind) => void
  label: string
}

const options = [
  { k: "expense" as const, optionLabel: "Gasto" },
  { k: "income" as const, optionLabel: "Ingreso" },
]

export const KindToggle = ({ value, onChange, label }: KindToggleProps) => {
  const handleSelect = (kind: TransactionKind) => {
    onChange(kind)
  }

  return (
    <div className="grid grid-cols-2 gap-2" role="tablist" aria-label={label}>
      {options.map(({ k, optionLabel }) => {
        const selected = value === k
        if (selected) {
          return (
            <Button
              key={k}
              type="button"
              role="tab"
              aria-selected
              color="emerald"
              onClick={() => handleSelect(k)}
              className="w-full"
            >
              {optionLabel}
            </Button>
          )
        }
        return (
          <Button
            key={k}
            type="button"
            role="tab"
            aria-selected={false}
            outline
            onClick={() => handleSelect(k)}
            className="w-full"
          >
            {optionLabel}
          </Button>
        )
      })}
    </div>
  )
}
