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
      tone="sand"
      className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
    >
      <div className="min-w-0">
        <h1 className="font-display text-4xl uppercase leading-[0.9] tracking-tight text-ink sm:text-5xl">
          {title}
        </h1>
        {children ? (
          <p className="mt-3 max-w-xl text-sm font-medium uppercase tracking-wide text-ink/70">
            {children}
          </p>
        ) : null}
      </div>
      {aside ? <div className="shrink-0">{aside}</div> : null}
    </BentoTile>
  )
}
