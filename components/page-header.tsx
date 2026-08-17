import type { ReactNode } from "react"
import { BentoTile } from "@/components/bento-tile"

interface PageHeaderProps {
  title: string
  children?: ReactNode
  aside?: ReactNode
}

export function PageHeader({ title, children, aside }: PageHeaderProps) {
  return (
    <BentoTile
      tone="forest"
      className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
    >
      <div className="min-w-0">
        <h1 className="font-display text-4xl uppercase leading-[0.9] tracking-tight text-sand sm:text-5xl">
          {title}
        </h1>
        {children ? (
          <p className="mt-3 max-w-xl text-sm font-medium uppercase tracking-wide text-sand/75">
            {children}
          </p>
        ) : null}
      </div>
      {aside ? (
        <div className="glass-inset-dark shrink-0 rounded-2xl p-3">{aside}</div>
      ) : null}
    </BentoTile>
  )
}
