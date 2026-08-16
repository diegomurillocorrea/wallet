"use client"

import { MoonIcon, SunIcon } from "@heroicons/react/16/solid"
import { useTheme } from "@/hooks/use-theme"

type ThemeToggleProps = {
  className?: string
}

export const ThemeToggle = ({ className = "" }: ThemeToggleProps) => {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === "dark"

  const handleClick = () => {
    toggleTheme()
  }

  return (
    <button
      type="button"
      className={`inline-flex size-10 items-center justify-center rounded-lg text-current hover:bg-current/10 focus-ring ${className}`}
      onClick={handleClick}
      aria-label={isDark ? "Activar modo claro" : "Activar modo oscuro"}
    >
      {isDark ? (
        <SunIcon className="size-5 fill-current" />
      ) : (
        <MoonIcon className="size-5 fill-current" />
      )}
    </button>
  )
}
