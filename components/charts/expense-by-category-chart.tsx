"use client"

import { Cell, Pie, PieChart, Tooltip } from "recharts"
import {
  chartTooltipItemStyle,
  chartTooltipLabelStyle,
  chartTooltipStyle,
  formatChartCurrency,
} from "@/components/charts/chart-theme"
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
      <p className="flex h-56 items-center justify-center text-center text-sm text-ink/70">
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
              <Cell
                key={entry.name}
                fill={entry.color}
                stroke="rgb(255 255 255 / 0.55)"
                strokeWidth={1}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={formatChartCurrency}
            contentStyle={chartTooltipStyle}
            labelStyle={chartTooltipLabelStyle}
            itemStyle={chartTooltipItemStyle}
          />
        </PieChart>
      ) : null}
    </div>
  )
}
