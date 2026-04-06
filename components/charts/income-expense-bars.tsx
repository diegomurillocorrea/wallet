"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

interface IncomeExpenseBarsProps {
  income: number
  expense: number
}

export const IncomeExpenseBars = ({ income, expense }: IncomeExpenseBarsProps) => {
  const data = [
    { name: "Ingresos", value: income, fill: "#059669" },
    { name: "Gastos", value: expense, fill: "#f97316" },
  ]

  return (
    <div className="h-56 w-full sm:h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} className="fill-slate-600 dark:fill-slate-400" />
          <YAxis tick={{ fontSize: 11 }} className="fill-slate-600 dark:fill-slate-400" />
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
      </ResponsiveContainer>
    </div>
  )
}
