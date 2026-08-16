import { Heading, Subheading } from "@/components/ui/heading"
import { Text } from "@/components/ui/text"
import { TransactionQuickForm } from "@/components/transaction-quick-form"
import { CategoryIcon } from "@/components/category-icon"
import { DeleteTransactionButton } from "@/components/delete-transaction-button"
import { EditTransactionDialog } from "@/components/edit-transaction-dialog"
import { WalletAppMonthSelect } from "@/components/wallet-app-month-select"
import { monthLabel } from "@/lib/dates/month"
import { formatDateEsSV } from "@/lib/dates/el-salvador"
import { getWalletAppMonthRange } from "@/lib/dates/wallet-app-month"
import { formatMoney } from "@/lib/format/money"
import { createClient } from "@/lib/supabase/server"
import type { CategoryRow, TransactionKind } from "@/lib/types/wallet"

interface TxRow {
  id: string
  amount: number | string
  kind: string
  note: string | null
  occurred_at: string
  category_id: string
  category: {
    id: string
    name: string
    color: string
    icon: string
    kind: string
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

  const { data: txData, count } = await supabase
    .from("transactions")
    .select(
      `
      id,
      amount,
      kind,
      note,
      occurred_at,
      category_id,
      category:categories ( id, name, color, icon, kind )
    `,
      { count: "exact" }
    )
    .eq("user_id", user.id)
    .gte("occurred_at", start)
    .lte("occurred_at", end)
    .order("occurred_at", { ascending: false })
    .limit(200)

  const rows = (txData ?? []) as unknown as TxRow[]
  const totalCount = count ?? rows.length
  const isTruncated = totalCount > rows.length

  const NO_CATEGORY_KEY = "__sin-categoria__"
  const groupsMap = new Map<string, TxGroup>()
  for (const t of rows) {
    const key = t.category?.id ?? NO_CATEGORY_KEY
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
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Heading>Movimientos</Heading>
          <Text className="mt-1">
            Mostrando {monthLabel(monthStart)} (mismo mes que en Resumen).
          </Text>
        </div>
        <WalletAppMonthSelect monthStart={monthStart} />
      </header>

      <TransactionQuickForm categories={categories} monthStart={start} monthEnd={end} />

      <section
        className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6"
        aria-labelledby="tx-list-heading"
      >
        <Subheading id="tx-list-heading" level={2}>
          Historial
        </Subheading>
        {rows.length === 0 ? (
          <Text className="mt-4">
            No hay movimientos en {monthLabel(monthStart)}.
          </Text>
        ) : (
          <div className="mt-4 flex flex-col gap-6">
            {isTruncated ? (
              <Text>
                Mostrando los {rows.length} más recientes de {totalCount} en este mes.
              </Text>
            ) : null}
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
                  <span className="text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
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
                            {formatDateEsSV(t.occurred_at)}
                            {t.note ? ` · ${t.note}` : ""}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 text-sm font-semibold tabular-nums ${isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-orange-600 dark:text-orange-400"}`}
                        >
                          {isIncome ? "+" : "-"}
                          {formatMoney(Number(t.amount))}
                        </span>
                        <EditTransactionDialog
                          movement={{
                            id: t.id,
                            amount: Number(t.amount),
                            note: t.note,
                            occurredAt: String(t.occurred_at).slice(0, 10),
                            categoryId: t.category_id,
                            kind: t.kind as TransactionKind,
                          }}
                          monthStart={start}
                          monthEnd={end}
                          categories={categories}
                        />
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
