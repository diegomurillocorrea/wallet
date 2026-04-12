"use client"

import { useCallback, useLayoutEffect, useState } from "react"

const THEME_KEY = "theme"

function getInitialTheme(): string {
  if (typeof window === "undefined") return "light"
  const saved = localStorage.getItem(THEME_KEY)
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
  return saved || (prefersDark ? "dark" : "light")
}

function applyTheme(theme: string) {
  if (typeof document === "undefined") return
  if (theme === "dark") {
    document.documentElement.classList.add("dark")
    document.documentElement.classList.remove("light")
    return
  }
  document.documentElement.classList.add("light")
  document.documentElement.classList.remove("dark")
}

export function useTheme() {
  const [theme, setTheme] = useState("light")

  useLayoutEffect(() => {
    const initial = getInitialTheme()
    setTheme(initial)
    applyTheme(initial)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light"
      if (typeof localStorage !== "undefined") localStorage.setItem(THEME_KEY, next)
      applyTheme(next)
      return next
    })
  }, [])

  return { theme, toggleTheme }
}
