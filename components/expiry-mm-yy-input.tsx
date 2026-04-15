"use client"

import { useEffect, useState, type ChangeEvent } from "react"
import { formatExpiryMmYyTyping } from "@/lib/credit-card/format"

interface ExpiryMmYyInputProps {
  id: string
  name: string
  initialValue?: string
  required?: boolean
  placeholder?: string
  className?: string
  "aria-describedby"?: string
}

export function ExpiryMmYyInput({
  id,
  name,
  initialValue = "",
  required,
  placeholder = "MM/AA",
  className,
  "aria-describedby": ariaDescribedBy,
}: ExpiryMmYyInputProps) {
  const [value, setValue] = useState(() => formatExpiryMmYyTyping(initialValue))

  useEffect(() => {
    setValue(formatExpiryMmYyTyping(initialValue))
  }, [initialValue])

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setValue(formatExpiryMmYyTyping(e.target.value))
  }

  return (
    <input
      id={id}
      name={name}
      type="text"
      inputMode="numeric"
      autoComplete="cc-exp"
      required={required}
      value={value}
      onChange={handleChange}
      maxLength={5}
      placeholder={placeholder}
      aria-describedby={ariaDescribedBy}
      className={className}
    />
  )
}
