import { ArrowLeftIcon } from "@heroicons/react/16/solid"
import { getCreditCardBudgetUsage } from "@/app/(app)/actions/credit-card-actions"
import { CreditCardBudgetUsageView } from "@/components/credit-card-budget-usage-view"
import { Button } from "@/components/ui/button"
import { Heading } from "@/components/ui/heading"
import { Text } from "@/components/ui/text"
import { createClient } from "@/lib/supabase/server"

export default async function CreditCardBudgetLinksPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const usageResult = await getCreditCardBudgetUsage()

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Button href="/credit-cards" plain className="mb-2">
            <ArrowLeftIcon />
            Volver a Tarjetas
          </Button>
          <Heading>Presupuestos por tarjeta</Heading>
          <Text className="mt-1">
            Categorías ligadas a cada plástico (etiqueta visual) y gasto del mes en esas categorías.
          </Text>
        </div>
      </header>

      {!usageResult.ok ? (
        <p
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100"
          role="alert"
        >
          No se pudieron cargar los vínculos: {usageResult.error}
        </p>
      ) : (
        <CreditCardBudgetUsageView groups={usageResult.groups} />
      )}
    </div>
  )
}
