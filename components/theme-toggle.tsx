"use client"

import { Moon, Sun } from "lucide-react"
import { useEffect, useState } from "react"

export const ThemeToggle = () => {
  const [mounted, setMounted] = useState(false)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setMounted(true)
      const root = document.documentElement
      const stored = localStorage.getItem("theme")
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      root.classList.remove("light", "dark")
      if (stored === "dark") {
        root.classList.add("dark")
        setIsDark(true)
        return
      }
      if (stored === "light") {
        root.classList.add("light")
        setIsDark(false)
        return
      }
      if (prefersDark) {
        root.classList.add("dark")
        setIsDark(true)
        return
      }
      setIsDark(false)
    })
    return () => cancelAnimationFrame(id)
  }, [])

  const handleClick = () => {
    const root = document.documentElement
    if (isDark) {
      root.classList.remove("dark")
      root.classList.add("light")
      setIsDark(false)
      localStorage.setItem("theme", "light")
      return
    }
    root.classList.remove("light")
    root.classList.add("dark")
    setIsDark(true)
    localStorage.setItem("theme", "dark")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      handleClick()
    }
  }

  if (!mounted) {
    return (
      <span
        className="inline-flex size-11 items-center justify-center rounded-xl border border-slate-200 bg-white opacity-0 dark:border-slate-700 dark:bg-slate-900"
        aria-hidden
      />
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className="inline-flex size-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
      aria-label={isDark ? "Activar modo claro" : "Activar modo oscuro"}
    >
      {isDark ? <Sun className="size-5" aria-hidden /> : <Moon className="size-5" aria-hidden />}
    </button>
  )
}
