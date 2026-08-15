"use client"

import { useEffect, useState, type ChangeEvent } from "react"
import { Input } from "@/components/ui/input"
import { formatPanTyping } from "@/lib/credit-card/format"

interface Pan16InputProps {
  id: string
  name: string
  initialValue?: string
  required?: boolean
  placeholder?: string
  "aria-describedby"?: string
}

export function Pan16Input({
  id,
  name,
  initialValue = "",
  required,
  placeholder = "0000 0000 0000 0000",
  "aria-describedby": ariaDescribedBy,
}: Pan16InputProps) {
  const [value, setValue] = useState(() => formatPanTyping(initialValue))

  useEffect(() => {
    setValue(formatPanTyping(initialValue))
  }, [initialValue])

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setValue(formatPanTyping(e.target.value))
  }

  return (
    <Input
      id={id}
      name={name}
      type="text"
      inputMode="numeric"
      autoComplete="cc-number"
      required={required}
      value={value}
      onChange={handleChange}
      maxLength={19}
      placeholder={placeholder}
      aria-describedby={ariaDescribedBy}
    />
  )
}
