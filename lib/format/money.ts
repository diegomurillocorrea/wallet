export const formatMoney = (value: number) =>
  new Intl.NumberFormat("es-SV", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value)
