import type { CSSProperties } from "react"

const currencyFormatter = new Intl.NumberFormat("es-SV", {
  style: "currency",
  currency: "USD",
})

export const formatChartCurrency = (value: unknown) => currencyFormatter.format(Number(value ?? 0))

/*
 * Los charts viven dentro de paneles de vidrio claro, así que el tooltip es la
 * capa más alta de la jerarquía: desenfoque fuerte, borde luminoso y sombra de
 * flotación. Recharts sólo acepta estilos en línea, por eso vive aquí y no en CSS.
 */
export const chartTooltipStyle: CSSProperties = {
  borderRadius: "14px",
  border: "1px solid rgb(255 255 255 / 0.55)",
  background: "rgb(255 252 244 / 0.78)",
  backdropFilter: "blur(var(--glass-blur-lg)) saturate(var(--glass-saturation))",
  WebkitBackdropFilter: "blur(var(--glass-blur-lg)) saturate(var(--glass-saturation))",
  boxShadow: "var(--glass-shadow-lg), var(--glass-highlight-light)",
  color: "var(--ink)",
  padding: "8px 12px",
} as CSSProperties

export const chartTooltipLabelStyle: CSSProperties = {
  color: "rgb(0 0 0 / 0.6)",
  fontSize: "0.75rem",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
}

export const chartTooltipItemStyle: CSSProperties = {
  color: "var(--ink)",
  fontWeight: 600,
}

export const chartTooltipCursor = { fill: "rgb(1 62 55 / 0.06)" }
