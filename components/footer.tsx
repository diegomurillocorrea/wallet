"use client"

import { WallyMark } from "@/components/wally-mark"

export function Footer() {
  return (
    <footer
      className="px-3 pb-3"
      role="contentinfo"
      aria-label="Pie de página"
    >
      <div className="flex w-full flex-wrap items-center justify-between gap-4 rounded-[1.75rem] bg-sand px-5 py-4 text-ink [--wally-counter:var(--color-sand)] sm:px-7">
        <div className="flex items-center gap-3">
          <WallyMark className="size-9 shrink-0" />
          <span className="font-display text-lg uppercase tracking-tight">Wally</span>
        </div>
        <span className="text-sm font-medium uppercase tracking-wide">
          Wally © 2026
        </span>
      </div>
    </footer>
  )
}
