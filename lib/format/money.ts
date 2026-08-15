export const formatMoney = (value: number) =>
  new Intl.NumberFormat("es-SV", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value)

/** Saldo pendiente de un presupuesto (nunca negativo; 2 decimales) */
export const remainingToPay = (limit: number, spent: number) =>
  Math.max(0, Math.round((limit - spent) * 100) / 100)
