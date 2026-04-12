import dynamicIconImports from "lucide-react/dynamicIconImports"

const validIconKeys = new Set(Object.keys(dynamicIconImports))

export const getLucideIconKeySet = (): ReadonlySet<string> => validIconKeys

/** Convierte nombre tipo React (`ShoppingCart`) a slug de Lucide (`shopping-cart`). */
export const pascalCaseToLucideSlug = (value: string): string => {
  const s = value.trim().replace(/\s+/g, "")
  if (!s) return ""
  return s
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .toLowerCase()
}

/**
 * Acepta slug kebab (`shopping-cart`), PascalCase legado (`ShoppingCart`) o espacios como guiones.
 * Devuelve la clave canónica de `lucide-react` o null si no existe.
 */
export const resolveCategoryIconKey = (stored: string): string | null => {
  const raw = stored.trim()
  if (!raw) return null

  const slugFromSpaces = raw.replace(/\s+/g, "-").toLowerCase()
  if (validIconKeys.has(slugFromSpaces)) return slugFromSpaces

  const fromPascal = pascalCaseToLucideSlug(raw)
  if (fromPascal && validIconKeys.has(fromPascal)) return fromPascal

  return null
}
