"use client"

import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts"
import { useChartContainerSize } from "@/hooks/use-chart-container-size"

interface IncomeExpenseBarsProps {
  income: number
  expense: number
}

export const IncomeExpenseBars = ({ income, expense }: IncomeExpenseBarsProps) => {
  const { ref, width, height } = useChartContainerSize()
  const data = [
    { name: "Ingresos", value: income, fill: "#059669" },
    { name: "Gastos", value: expense, fill: "#f97316" },
  ]

  return (
    <div ref={ref} className="h-56 w-full min-w-0 sm:h-64">
      {width > 0 && height > 0 ? (
        <BarChart
          width={width}
          height={height}
          data={data}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} className="fill-zinc-600 dark:fill-zinc-400" />
          <YAxis tick={{ fontSize: 11 }} className="fill-zinc-600 dark:fill-zinc-400" />
          <Tooltip
            formatter={(v) =>
              new Intl.NumberFormat("es-SV", { style: "currency", currency: "USD" }).format(
                Number(v ?? 0)
              )
            }
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid rgb(226 232 240)",
              background: "white",
            }}
          />
          <Bar dataKey="value" radius={[8, 8, 0, 0]} name="Monto" />
        </BarChart>
      ) : null}
    </div>
  )
}
