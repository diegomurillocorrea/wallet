import clsx from "clsx"
import type { ElementType, ReactNode } from "react"

const tones = {
  sand: "bg-sand text-ink [--wally-counter:var(--color-sand)]",
  forest: "bg-forest text-sand [--wally-counter:var(--color-forest)]",
  paper: "bg-paper text-ink [--wally-counter:var(--color-sand)]",
  ink: "bg-ink text-sand [--wally-counter:var(--color-ink)]",
} as const

export type BentoTone = keyof typeof tones

interface BentoTileProps {
  tone?: BentoTone
  className?: string
  children: ReactNode
  as?: ElementType
  id?: string
  "aria-labelledby"?: string
}

export function BentoTile({
  tone = "sand",
  className,
  children,
  as: Comp = "div",
  id,
  "aria-labelledby": ariaLabelledby,
}: BentoTileProps) {
  return (
    <Comp
      id={id}
      aria-labelledby={ariaLabelledby}
      className={clsx(
        "relative overflow-hidden rounded-[1.75rem] p-5 sm:rounded-[2rem] sm:p-7",
        tones[tone],
        className
      )}
    >
      {children}
    </Comp>
  )
}
