import clsx from "clsx"
import type { ElementType, ReactNode } from "react"

/*
 * `light` marca el subárbol como contexto claro: la variante `dark` definida en
 * globals.css se desactiva dentro de él, así los componentes Catalyst heredan
 * sus estilos claros sobre el vidrio de papel.
 */
const tones = {
  sand: "light glass-tile-sand text-ink",
  forest: "glass-tile-forest text-sand",
  paper: "light glass-tile text-ink",
  ink: "glass-tile-ink text-sand",
} as const

const lifts = {
  sand: "glass-lift",
  forest: "glass-lift-dark",
  paper: "glass-lift",
  ink: "glass-lift-dark",
} as const

export type BentoTone = keyof typeof tones

interface BentoTileProps {
  tone?: BentoTone
  /** Añade elevación al hover: reservalo para baldosas que llevan a una acción */
  interactive?: boolean
  className?: string
  children: ReactNode
  as?: ElementType
  id?: string
  "aria-labelledby"?: string
}

export function BentoTile({
  tone = "paper",
  interactive = false,
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
        "relative overflow-hidden rounded-tile p-5 sm:rounded-tile-lg sm:p-7",
        tones[tone],
        interactive && lifts[tone],
        className
      )}
    >
      {children}
    </Comp>
  )
}
