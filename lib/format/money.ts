export const formatMoney = (value: number) =>
  new Intl.NumberFormat("es-SV", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value)

/** Redondeo a 2 decimales (centavos) */
export const roundMoney = (value: number) => Math.round(value * 100) / 100

/** Saldo pendiente de un presupuesto (nunca negativo; 2 decimales) */
export const remainingToPay = (limit: number, spent: number) =>
  Math.max(0, roundMoney(limit - spent))

/** Valida monto > 0 con como máximo 2 decimales y techo razonable */
export const isValidMoneyAmount = (value: number, max = 1_000_000_000): boolean => {
  if (!Number.isFinite(value) || value <= 0 || value > max) return false
  const scaled = value * 100
  return Math.abs(scaled - Math.round(scaled)) < 1e-8
}
