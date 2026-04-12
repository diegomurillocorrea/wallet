"use client"

import { memo, useCallback, useMemo, useState } from "react"
import { Circle } from "lucide-react"
import { DynamicIcon, iconNames, type IconName } from "lucide-react/dynamic"
import { resolveCategoryIconKey } from "@/lib/lucide-category-icon"

const POPULAR_SLUGS = [
  "circle",
  "wallet",
  "home",
  "car",
  "utensils-crossed",
  "shopping-cart",
  "coffee",
  "gamepad-2",
  "heart-pulse",
  "graduation-cap",
  "more-horizontal",
  "banknote",
  "laptop",
  "trending-up",
  "piggy-bank",
  "credit-card",
  "bus",
  "plane",
  "briefcase",
  "gift",
  "smartphone",
  "dog",
  "cat",
  "baby",
  "dumbbell",
] as const satisfies readonly string[]

const allNames = iconNames as readonly string[]

const POPULAR_ORDERED = POPULAR_SLUGS.filter((k) => allNames.includes(k)) as IconName[]

const MAX_GRID = 48

type IconPickButtonProps = {
  iconKey: IconName
  isSelected: boolean
  onSelect: (key: IconName) => void
}

const IconPickButton = memo(({ iconKey, isSelected, onSelect }: IconPickButtonProps) => {
  const handleClick = () => {
    onSelect(iconKey)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      onSelect(iconKey)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={`Elegir ícono ${iconKey}`}
      aria-pressed={isSelected}
      className={`flex size-10 items-center justify-center rounded-xl border text-zinc-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/50 dark:text-zinc-200 ${
        isSelected
          ? "border-emerald-500 bg-emerald-50 dark:border-emerald-400 dark:bg-emerald-950/50"
          : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
      }`}
    >
      <DynamicIcon
        name={iconKey}
        className="size-5 shrink-0"
        fallback={() => <Circle className="size-5 shrink-0" aria-hidden />}
      />
    </button>
  )
})

IconPickButton.displayName = "IconPickButton"

type CategoryIconPickerProps = {
  defaultIcon?: string
  idPrefix?: string
}

export const CategoryIconPicker = ({ defaultIcon = "circle", idPrefix = "cat-icon" }: CategoryIconPickerProps) => {
  const searchId = `${idPrefix}-search`
  const hintId = `${idPrefix}-hint`
  const exactId = `${idPrefix}-exact`

  const initial = resolveCategoryIconKey(defaultIcon) ?? "circle"
  const [selected, setSelected] = useState<IconName>(initial as IconName)
  const [query, setQuery] = useState("")
  const [exactDraft, setExactDraft] = useState("")

  const { displayKeys, totalMatches } = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/\s+/g, "-")
    if (q.length === 0) {
      return {
        displayKeys: POPULAR_ORDERED.slice(0, MAX_GRID),
        totalMatches: POPULAR_ORDERED.length,
      }
    }
    const hits = allNames
      .filter((n) => n.includes(q))
      .map((n) => n as IconName)
    hits.sort((a, b) => {
      const sa = String(a)
      const sb = String(b)
      const pa = sa.startsWith(q) ? 0 : 1
      const pb = sb.startsWith(q) ? 0 : 1
      if (pa !== pb) return pa - pb
      return sa.localeCompare(sb)
    })
    return {
      displayKeys: hits.slice(0, MAX_GRID),
      totalMatches: hits.length,
    }
  }, [query])

  const handleApplyExact = useCallback(() => {
    const resolved = resolveCategoryIconKey(exactDraft)
    if (!resolved) return
    setSelected(resolved as IconName)
    setExactDraft("")
  }, [exactDraft])

  return (
    <div className="flex flex-col gap-3">
      <label htmlFor={searchId} className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">
        Buscar ícono
      </label>
      <input
        id={searchId}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Ej. dog, coffee, train-front…"
        autoComplete="off"
        className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder-zinc-500"
        aria-describedby={hintId}
      />
      <p id={hintId} className="text-xs text-zinc-500 dark:text-zinc-400">
        Nombres en inglés (como en{" "}
        <a
          href="https://lucide.dev/icons/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
        >
          lucide.dev
        </a>
        ). Con la búsqueda vacía ves sugeridos; escribiendo se filtran todos los disponibles.
      </p>

      <div
        className="grid max-h-56 grid-cols-6 gap-2 overflow-y-auto p-1 sm:grid-cols-8"
        role="listbox"
        aria-label="Íconos disponibles"
      >
        {displayKeys.map((key) => (
          <IconPickButton key={key} iconKey={key} isSelected={selected === key} onSelect={setSelected} />
        ))}
      </div>

      {query.trim().length > 0 && totalMatches > displayKeys.length ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-400" role="status">
          Mostrando {displayKeys.length} de {totalMatches} coincidencias. Seguí escribiendo para acotar.
        </p>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <label htmlFor={exactId} className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Nombre exacto (opcional)
          </label>
          <input
            id={exactId}
            type="text"
            value={exactDraft}
            onChange={(e) => setExactDraft(e.target.value)}
            placeholder="Ej. ShoppingCart o train-front"
            autoComplete="off"
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>
        <button
          type="button"
          onClick={handleApplyExact}
          disabled={!resolveCategoryIconKey(exactDraft)}
          className="h-11 shrink-0 rounded-xl border border-zinc-200 bg-zinc-100 px-4 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
        >
          Usar nombre
        </button>
      </div>

      <input type="hidden" name="icon" value={selected} />

      <div className="flex items-center gap-3 rounded-xl border border-zinc-100 bg-zinc-50/80 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950/50">
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Seleccionado:</span>
        <code className="text-xs text-zinc-800 dark:text-zinc-200">{selected}</code>
        <DynamicIcon
          name={selected}
          className="ml-auto size-7 text-zinc-800 dark:text-zinc-200"
          fallback={() => <Circle className="ml-auto size-7" aria-hidden />}
        />
      </div>
    </div>
  )
}
