/** Valida PAN de 16 dígitos con algoritmo de Luhn */
export const isValidLuhnPan = (digits: string): boolean => {
  if (!/^\d{16}$/.test(digits)) return false
  let sum = 0
  let alt = false
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = Number.parseInt(digits[i]!, 10)
    if (alt) {
      n *= 2
      if (n > 9) n -= 9
    }
    sum += n
    alt = !alt
  }
  return sum % 10 === 0
}
