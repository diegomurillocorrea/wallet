"use client"

import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts"
import {
  chartTooltipCursor,
  chartTooltipItemStyle,
  chartTooltipLabelStyle,
  chartTooltipStyle,
  formatChartCurrency,
} from "@/components/charts/chart-theme"
import { useChartContainerSize } from "@/hooks/use-chart-container-size"

interface IncomeExpenseBarsProps {
  income: number
  expense: number
}

export const IncomeExpenseBars = ({ income, expense }: IncomeExpenseBarsProps) => {
  const { ref, width, height } = useChartContainerSize()
  const data = [
    { name: "Ingresos", value: income, fill: "#013e37" },
    { name: "Gastos", value: expense, fill: "#000000" },
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
          <CartesianGrid strokeDasharray="3 3" className="stroke-ink/10" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, fill: "rgb(0 0 0 / 0.7)" }}
            tickLine={false}
            axisLine={{ stroke: "rgb(0 0 0 / 0.12)" }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "rgb(0 0 0 / 0.55)" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={formatChartCurrency}
            cursor={chartTooltipCursor}
            contentStyle={chartTooltipStyle}
            labelStyle={chartTooltipLabelStyle}
            itemStyle={chartTooltipItemStyle}
          />
          <Bar dataKey="value" radius={[8, 8, 0, 0]} name="Monto" />
        </BarChart>
      ) : null}
    </div>
  )
}
