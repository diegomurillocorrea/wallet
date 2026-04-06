"use client"

import {
  Banknote,
  Car,
  Circle,
  Gamepad2,
  GraduationCap,
  HeartPulse,
  Home,
  Laptop,
  MoreHorizontal,
  TrendingUp,
  UtensilsCrossed,
  Wallet,
  type LucideIcon,
} from "lucide-react"

const MAP: Record<string, LucideIcon> = {
  UtensilsCrossed,
  Utensils: UtensilsCrossed,
  Car,
  Home,
  Gamepad2,
  HeartPulse,
  GraduationCap,
  MoreHorizontal,
  Banknote,
  Laptop,
  TrendingUp,
  Wallet,
  Circle,
}

interface CategoryIconProps {
  name: string
  className?: string
}

export const CategoryIcon = ({ name, className }: CategoryIconProps) => {
  const Icon = MAP[name] ?? Circle
  return <Icon className={className} aria-hidden />
}

export const CATEGORY_ICON_OPTIONS = [
  "UtensilsCrossed",
  "Car",
  "Home",
  "Gamepad2",
  "HeartPulse",
  "GraduationCap",
  "MoreHorizontal",
  "Banknote",
  "Laptop",
  "TrendingUp",
  "Wallet",
  "Circle",
] as const
