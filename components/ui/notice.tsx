import clsx from "clsx"
import type { ReactNode } from "react"

/*
 * Bloque semántico translúcido. Se integra al vidrio sin perder el color de
 * estado: fondo y borde tintados, texto a contraste pleno.
 */
const tones = {
  success:
    "border-emerald-600/25 bg-emerald-600/8 text-emerald-800 dark:border-butter/28 dark:bg-butter/10 dark:text-butter",
  warning:
    "border-amber-600/30 bg-amber-400/15 text-amber-800 dark:border-amber-300/30 dark:bg-amber-400/12 dark:text-amber-100",
  danger:
    "border-red-600/25 bg-red-600/10 text-red-700 dark:border-red-400/30 dark:bg-red-500/12 dark:text-red-200",
  info: "border-forest/15 bg-forest/6 text-ink/80 dark:border-butter/18 dark:bg-butter/8 dark:text-sand/80",
} as const

export type NoticeTone = keyof typeof tones

const defaultRoles: Record<NoticeTone, "alert" | "status"> = {
  success: "status",
  warning: "alert",
  danger: "alert",
  info: "status",
}

interface NoticeProps {
  tone?: NoticeTone
  role?: "alert" | "status"
  className?: string
  children: ReactNode
}

export function Notice({ tone = "info", role, className, children }: NoticeProps) {
  return (
    <p
      role={role ?? defaultRoles[tone]}
      className={clsx(
        "rounded-xl border px-4 py-3 text-sm font-medium",
        tones[tone],
        className
      )}
    >
      {children}
    </p>
  )
}
