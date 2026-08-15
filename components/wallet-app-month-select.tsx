"use client"

import { useRouter } from "next/navigation"
import { useMemo, useTransition } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { setWalletAppMonth } from "@/app/(app)/actions/wallet-actions"
import { Field, Label } from "@/components/ui/fieldset"
import { Select } from "@/components/ui/select"
import { todayDateInElSalvador } from "@/lib/dates/el-salvador"

interface WalletAppMonthSelectProps {
  monthStart: string
}

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
    const currentY = todayDateInElSalvador().getFullYear()
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
      <Field className="min-w-[140px] flex-1 sm:flex-initial">
        <Label>Mes</Label>
        <Select
          id="wallet-app-month-part"
          value={monthValue}
          onChange={handleMonthChange}
          disabled={isPending}
          aria-label="Mes del contexto global de la app"
        >
          {monthOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field className="min-w-[120px] flex-1 sm:flex-initial">
        <Label>Año</Label>
        <Select
          id="wallet-app-year-part"
          value={yearValue}
          onChange={handleYearChange}
          disabled={isPending}
          aria-label="Año del contexto global de la app"
        >
          {yearOptions.map((y) => (
            <option key={y} value={String(y)}>
              {y}
            </option>
          ))}
        </Select>
      </Field>
    </div>
  )
}
