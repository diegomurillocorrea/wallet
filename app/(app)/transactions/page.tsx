import { TransactionQuickForm } from "@/components/transaction-quick-form"
import { CategoryIcon } from "@/components/category-icon"
import { DeleteTransactionButton } from "@/components/delete-transaction-button"
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
    .order("occurred_at", { ascending: false })
    .limit(200)

  const rows = (txData ?? []) as unknown as TxRow[]

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Movimientos
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Historial y registro rápido.
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
          <ul className="mt-4 divide-y divide-zinc-100 dark:divide-zinc-800">
            {rows.map((t) => {
              const cat = t.category
              const isIncome = t.kind === "income"
              return (
                <li key={t.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  {cat ? (
                    <span
                      className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800"
                      style={{ color: cat.color }}
                    >
                      <CategoryIcon name={cat.icon} className="size-5" />
                    </span>
                  ) : (
                    <span className="size-10 shrink-0 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {cat?.name ?? "Sin categoría"}
                    </p>
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
        )}
      </section>
    </div>
  )
}
