"use client"

import { MoonIcon, SunIcon } from "@heroicons/react/16/solid"
import { useTheme } from "@/hooks/use-theme"
import { Button } from "@/components/ui/button"

type ThemeToggleProps = {
  className?: string
}

export const ThemeToggle = ({ className }: ThemeToggleProps) => {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === "dark"

  const handleClick = () => {
    toggleTheme()
  }

  return (
    <Button
      plain
      type="button"
      className={className}
      onClick={handleClick}
      aria-label={isDark ? "Activar modo claro" : "Activar modo oscuro"}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </Button>
  )
}
