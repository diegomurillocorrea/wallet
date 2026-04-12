"use client"

import { Circle } from "lucide-react"
import { DynamicIcon, type IconName } from "lucide-react/dynamic"
import { resolveCategoryIconKey } from "@/lib/lucide-category-icon"

interface CategoryIconProps {
  name: string
  className?: string
}

export const CategoryIcon = ({ name, className }: CategoryIconProps) => {
  const key = resolveCategoryIconKey(name)
  if (!key) {
    return <Circle className={className} aria-hidden />
  }

  return (
    <DynamicIcon
      name={key as IconName}
      className={className}
      aria-hidden
      fallback={() => <Circle className={className} aria-hidden />}
    />
  )
}
