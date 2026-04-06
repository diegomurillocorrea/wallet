"use client"

import { motion } from "framer-motion"
import type { ReactNode } from "react"

interface MotionStatCardProps {
  children: ReactNode
  className?: string
}

export const MotionStatCard = ({ children, className }: MotionStatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.25 }}
    className={className}
  >
    {children}
  </motion.div>
)
