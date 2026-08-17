"use client"

import { memo, useCallback, useMemo, useState } from "react"
import { Circle } from "lucide-react"
import { DynamicIcon, iconNames, type IconName } from "lucide-react/dynamic"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { resolveCategoryIconKey } from "@/lib/lucide-category-icon"

const pickerLabelClass = "block text-xs font-semibold uppercase tracking-wide text-ink/70 dark:text-sand/60"

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
      className={`glass-interactive flex size-10 items-center justify-center rounded-xl border focus:outline-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest dark:focus-visible:outline-butter ${
        isSelected
          ? "border-forest/70 bg-forest/12 text-forest dark:border-butter/70 dark:bg-butter/15 dark:text-butter"
          : "border-white/55 bg-white/45 text-ink/75 hover:border-white/75 hover:bg-white/65 dark:border-butter/15 dark:bg-butter/5 dark:text-sand/80 dark:hover:border-butter/30 dark:hover:bg-butter/10"
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
      <label htmlFor={searchId} className={pickerLabelClass}>
        Buscar ícono
      </label>
      <Input
        id={searchId}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Ej. dog, coffee, train-front…"
        autoComplete="off"
        aria-describedby={hintId}
      />
      <p id={hintId} className="text-xs text-ink/70 dark:text-sand/60">
        Nombres en inglés (como en{" "}
        <a
          href="https://lucide.dev/icons/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-emerald-700 underline decoration-emerald-700/40 underline-offset-2 transition-colors hover:decoration-emerald-700 dark:text-butter dark:decoration-butter/40 dark:hover:decoration-butter"
        >
          lucide.dev
        </a>
        ). Con la búsqueda vacía ves sugeridos; escribiendo se filtran todos los disponibles.
      </p>

      <div
        className="glass-scroll grid max-h-56 grid-cols-6 gap-2 overflow-y-auto p-1 sm:grid-cols-8"
        role="listbox"
        aria-label="Íconos disponibles"
      >
        {displayKeys.map((key) => (
          <IconPickButton key={key} iconKey={key} isSelected={selected === key} onSelect={setSelected} />
        ))}
      </div>

      {query.trim().length > 0 && totalMatches > displayKeys.length ? (
        <p className="text-xs text-ink/70 dark:text-sand/60" role="status">
          Mostrando {displayKeys.length} de {totalMatches} coincidencias. Seguí escribiendo para acotar.
        </p>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <label htmlFor={exactId} className={pickerLabelClass}>
            Nombre exacto (opcional)
          </label>
          <Input
            id={exactId}
            type="text"
            value={exactDraft}
            onChange={(e) => setExactDraft(e.target.value)}
            placeholder="Ej. ShoppingCart o train-front"
            autoComplete="off"
            className="mt-1"
          />
        </div>
        <Button
          type="button"
          outline
          onClick={handleApplyExact}
          disabled={!resolveCategoryIconKey(exactDraft)}
          className="shrink-0"
        >
          Usar nombre
        </Button>
      </div>

      <input type="hidden" name="icon" value={selected} />

      <div className="glass-inset flex items-center gap-3 rounded-xl px-3 py-2 dark:border-butter/13 dark:bg-butter/7 dark:shadow-[inset_0_1px_0_rgb(255_239_179/0.08)]">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink/70 dark:text-sand/60">
          Seleccionado:
        </span>
        <code className="font-mono text-xs text-ink dark:text-sand">{selected}</code>
        <DynamicIcon
          name={selected}
          className="ml-auto size-7 text-ink dark:text-sand"
          fallback={() => <Circle className="ml-auto size-7" aria-hidden />}
        />
      </div>
    </div>
  )
}
