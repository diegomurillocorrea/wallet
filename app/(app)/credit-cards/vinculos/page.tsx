import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getCreditCardBudgetUsage } from "@/app/(app)/actions/credit-card-actions"
import { CreditCardBudgetUsageView } from "@/components/credit-card-budget-usage-view"
import { createClient } from "@/lib/supabase/server"

export default async function CreditCardBudgetLinksPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const groups = await getCreditCardBudgetUsage()

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/credit-cards"
            className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
          >
            <ArrowLeft className="size-4 shrink-0" aria-hidden />
            Volver a Tarjetas
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Presupuestos por tarjeta
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Categorías vinculadas a cada plástico y gasto del mes que elegís en Resumen.
          </p>
        </div>
      </header>

      <CreditCardBudgetUsageView groups={groups} />
    </div>
  )
}
