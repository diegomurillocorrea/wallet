export const normalizePanDigits = (raw: string): string => raw.replace(/\D/g, "")

export const panLast4 = (pan: string): string => {
  const d = normalizePanDigits(pan)
  return d.length >= 4 ? d.slice(-4) : d
}

/** PAN mientras se escribe: hasta 16 dígitos con espacio cada 4 (ej. 4111 1111 1111 1111) */
export const formatPanTyping = (raw: string): string => {
  const digits = normalizePanDigits(raw).slice(0, 16)
  const chunks: string[] = []
  for (let i = 0; i < digits.length; i += 4) {
    chunks.push(digits.slice(i, i + 4))
  }
  return chunks.join(" ")
}

/** Nombre completo en UI a partir de columnas legacy (nombre + apellido o solo nombre). */
export const holderDisplayFull = (holderFirstName: string, holderLastName: string): string =>
  `${holderFirstName} ${holderLastName}`.trim().replace(/\s+/g, " ")

/** Etiqueta corta para selects / badges (ej. "Juan P." o "María" si es una sola palabra). */
export const holderShortFromCard = (holderFirstName: string, holderLastName: string): string => {
  const full = holderDisplayFull(holderFirstName, holderLastName)
  if (!full) return "Titular"
  const parts = full.split(" ")
  if (parts.length === 1) return parts[0]!
  return `${parts[0]} ${parts[parts.length - 1]!.charAt(0)}.`
}

/** Mientras se escribe: hasta 4 dígitos → MM/AA (ej. 1234 → 12/34) */
export const formatExpiryMmYyTyping = (raw: string): string => {
  const digits = raw.replace(/\D/g, "").slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

/** Año calendario completo → etiqueta MM/AA */
export const formatExpMmYy = (expMonth: number, expYear: number): string => {
  const mm = String(expMonth).padStart(2, "0")
  const yy = String(expYear).slice(-2)
  return `${mm}/${yy}`
}

/**
 * Parsea "MM/AA", "MM/YYYY", "MMAA" o "MM-AA" → mes 1–12 y año 2000–2100.
 */
export const parseExpiryInput = (raw: string): { expMonth: number, expYear: number } | null => {
  const s = raw.trim()
  if (!s) return null
  const compact = s.replace(/\D/g, "")
  if (compact.length === 4) {
    const expMonth = Number.parseInt(compact.slice(0, 2), 10)
    const yy = Number.parseInt(compact.slice(2, 4), 10)
    if (expMonth < 1 || expMonth > 12 || Number.isNaN(yy)) return null
    const expYear = 2000 + yy
    return { expMonth, expYear }
  }
  const m = /^(\d{1,2})\s*[/\-]\s*(\d{2,4})$/.exec(s)
  if (!m) return null
  const expMonth = Number.parseInt(m[1]!, 10)
  let y = Number.parseInt(m[2]!, 10)
  if (expMonth < 1 || expMonth > 12 || Number.isNaN(y)) return null
  if (y < 100) y = 2000 + y
  if (y < 2000 || y > 2100) return null
  return { expMonth, expYear: y }
}
