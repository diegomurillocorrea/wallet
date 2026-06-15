import { TransactionQuickForm } from "@/components/transaction-quick-form"
import { CategoryIcon } from "@/components/category-icon"
import { DeleteTransactionButton } from "@/components/delete-transaction-button"
import { monthLabel } from "@/lib/dates/month"
import { getWalletAppMonthRange } from "@/lib/dates/wallet-app-month"
import { formatMoney } from "@/lib/format/money"
import { createClient } from "@/lib/supabase/server"
import type { CategoryRow } from "@/lib/types/wallet"

interface TxRow {
  id: string
  amount: number | string
  kind: string
  note: string | null
  occurred_at: string
  category: {
    name: string
    color: string
    icon: string
  } | null
}

interface TxGroup {
  key: string
  name: string
  color: string | null
  icon: string | null
  items: TxRow[]
}

export default async function TransactionsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: categoriesData } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", user.id)
    .order("name")

  const categories = (categoriesData ?? []) as CategoryRow[]

  const { start, end, monthStart } = await getWalletAppMonthRange()

  const { data: txData } = await supabase
    .from("transactions")
    .select(
      `
      id,
      amount,
      kind,
      note,
      occurred_at,
      category:categories ( name, color, icon )
    `
    )
    .eq("user_id", user.id)
    .gte("occurred_at", start)
    .lte("occurred_at", end)
    .order("occurred_at", { ascending: false })
    .limit(200)

  const rows = (txData ?? []) as unknown as TxRow[]

  const NO_CATEGORY_KEY = "__sin-categoria__"
  const groupsMap = new Map<string, TxGroup>()
  for (const t of rows) {
    const key = t.category?.name ?? NO_CATEGORY_KEY
    const existing = groupsMap.get(key)
    if (existing) {
      existing.items.push(t)
      continue
    }
    groupsMap.set(key, {
      key,
      name: t.category?.name ?? "Sin categoría",
      color: t.category?.color ?? null,
      icon: t.category?.icon ?? null,
      items: [t],
    })
  }

  const groups = Array.from(groupsMap.values())
  for (const group of groups) {
    group.items.sort((a, b) => a.occurred_at.localeCompare(b.occurred_at))
  }
  groups.sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Movimientos
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Mostrando {monthLabel(monthStart)} (mismo mes que en Resumen). Registro rápido abajo.
        </p>
      </header>

      <TransactionQuickForm categories={categories} />

      <section
        className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6"
        aria-labelledby="tx-list-heading"
      >
        <h2 id="tx-list-heading" className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Historial
        </h2>
        {rows.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
            No hay movimientos todavía.
          </p>
        ) : (
          <div className="mt-4 flex flex-col gap-6">
            {groups.map((group) => (
              <div key={group.key}>
                <div className="flex items-center gap-2">
                  {group.icon ? (
                    <span
                      className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800"
                      style={{ color: group.color ?? undefined }}
                    >
                      <CategoryIcon name={group.icon} className="size-4" />
                    </span>
                  ) : (
                    <span className="size-7 shrink-0 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
                  )}
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {group.name}
                  </h3>
                  <span className="text-xs tabular-nums text-zinc-400 dark:text-zinc-500">
                    {group.items.length}
                  </span>
                </div>
                <ul className="mt-2 divide-y divide-zinc-100 dark:divide-zinc-800">
                  {group.items.map((t) => {
                    const isIncome = t.kind === "income"
                    return (
                      <li key={t.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            {t.occurred_at}
                            {t.note ? ` · ${t.note}` : ""}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 text-sm font-semibold tabular-nums ${isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-orange-600 dark:text-orange-400"}`}
                        >
                          {isIncome ? "+" : "-"}
                          {formatMoney(Number(t.amount))}
                        </span>
                        <DeleteTransactionButton id={t.id} />
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
