"use client"

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"

interface Slice {
  name: string
  value: number
  color: string
}

interface ExpenseByCategoryChartProps {
  data: Slice[]
}

export const ExpenseByCategoryChart = ({ data }: ExpenseByCategoryChartProps) => {
  if (!data.length) {
    return (
      <p className="flex h-56 items-center justify-center text-center text-sm text-slate-500 dark:text-slate-400">
        Registrá gastos este mes para ver el desglose por categoría.
      </p>
    )
  }

  return (
    <div className="h-56 w-full sm:h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={48}
            outerRadius={80}
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
      </ResponsiveContainer>
    </div>
  )
}
