"use client"

import { Cell, Pie, PieChart, Tooltip } from "recharts"
import { useChartContainerSize } from "@/hooks/use-chart-container-size"

interface Slice {
  name: string
  value: number
  color: string
}

interface ExpenseByCategoryChartProps {
  data: Slice[]
}

export const ExpenseByCategoryChart = ({ data }: ExpenseByCategoryChartProps) => {
  const { ref, width, height } = useChartContainerSize()

  if (!data.length) {
    return (
      <p className="flex h-56 items-center justify-center text-center text-sm text-zinc-500 dark:text-zinc-400">
        Registrá gastos este mes para ver el desglose por categoría.
      </p>
    )
  }

  return (
    <div ref={ref} className="h-56 w-full min-w-0 sm:h-64">
      {width > 0 && height > 0 ? (
        <PieChart width={width} height={height}>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius="30%"
            outerRadius="48%"
            paddingAngle={2}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} stroke="transparent" />
            ))}
          </Pie>
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
        </PieChart>
      ) : null}
    </div>
  )
}
