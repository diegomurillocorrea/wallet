"use client"

import { MotionConfig } from "framer-motion"
import type { ReactNode } from "react"

/*
 * Las transiciones CSS ya se anulan con `prefers-reduced-motion` en globals.css,
 * pero las animaciones de Framer Motion corren en JavaScript y no ven esa media
 * query. Esto las alinea con la preferencia del sistema en toda la app.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}
