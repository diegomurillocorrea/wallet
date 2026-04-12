"use client"

import { useLayoutEffect, useRef, useState } from "react"

export interface ChartContainerSize {
  width: number
  height: number
}

export const useChartContainerSize = () => {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState<ChartContainerSize>({ width: 0, height: 0 })

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) {
      return
    }

    const measure = () => {
      const { width, height } = el.getBoundingClientRect()
      const nextW = Math.max(0, Math.floor(width))
      const nextH = Math.max(0, Math.floor(height))
      setSize((prev) => {
        if (prev.width === nextW && prev.height === nextH) {
          return prev
        }
        return { width: nextW, height: nextH }
      })
    }

    measure()

    if (typeof ResizeObserver === "undefined") {
      return
    }

    const observer = new ResizeObserver(() => measure())
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return { ref, width: size.width, height: size.height }
}
