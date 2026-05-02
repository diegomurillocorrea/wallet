"use client"

import { useRouter } from "next/navigation"
import { useMemo, useTransition } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { setWalletAppMonth } from "@/app/(app)/actions/wallet-actions"

interface WalletAppMonthSelectProps {
  monthStart: string
}

const selectClassName =
  "w-full min-w-[9rem] rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm font-medium text-zinc-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"

export function WalletAppMonthSelect({ monthStart }: WalletAppMonthSelectProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const yearValue = monthStart.slice(0, 4)
  const monthValue = monthStart.slice(5, 7)

  const monthOptions = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const m = i + 1
        const mm = String(m).padStart(2, "0")
        const labelRaw = format(new Date(2024, i, 1), "MMMM", { locale: es })
        const label = labelRaw.charAt(0).toUpperCase() + labelRaw.slice(1)
        return { value: mm, label }
      }),
    []
  )

  const yearOptions = useMemo(() => {
    const selectedY = Number(yearValue)
    const currentY = new Date().getFullYear()
    const safeY = Number.isFinite(selectedY) ? selectedY : currentY
    const minY = Math.min(safeY, currentY) - 15
    const maxY = Math.max(safeY, currentY) + 10
    const years: number[] = []
    for (let y = minY; y <= maxY; y++) {
      years.push(y)
    }
    return years
  }, [yearValue])

  const persistMonth = (year: string, month: string) => {
    const iso = `${year}-${month}-01`
    startTransition(() => {
      void (async () => {
        await setWalletAppMonth(iso)
        router.refresh()
      })()
    })
  }

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    persistMonth(yearValue, e.target.value)
  }

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    persistMonth(e.target.value, monthValue)
  }

  return (
    <div
      className="flex flex-wrap items-end gap-x-6 gap-y-3 sm:flex-nowrap"
      aria-busy={isPending}
    >
      <div className="flex min-w-[140px] flex-1 flex-col gap-1.5 sm:flex-initial">
        <label
          htmlFor="wallet-app-month-part"
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Mes:
        </label>
        <select
          id="wallet-app-month-part"
          value={monthValue}
          onChange={handleMonthChange}
          disabled={isPending}
          aria-label="Mes del contexto global de la app"
          className={selectClassName}
        >
          {monthOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex min-w-[120px] flex-1 flex-col gap-1.5 sm:flex-initial">
        <label
          htmlFor="wallet-app-year-part"
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Año:
        </label>
        <select
          id="wallet-app-year-part"
          value={yearValue}
          onChange={handleYearChange}
          disabled={isPending}
          aria-label="Año del contexto global de la app"
          className={selectClassName}
        >
          {yearOptions.map((y) => (
            <option key={y} value={String(y)}>
              {y}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
