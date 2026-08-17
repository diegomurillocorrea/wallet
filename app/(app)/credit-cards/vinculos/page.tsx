import { ArrowLeftIcon } from "@heroicons/react/16/solid"
import { getCreditCardBudgetUsage } from "@/app/(app)/actions/credit-card-actions"
import { CreditCardBudgetUsageView } from "@/components/credit-card-budget-usage-view"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Notice } from "@/components/ui/notice"
import { createClient } from "@/lib/supabase/server"

export default async function CreditCardBudgetLinksPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const usageResult = await getCreditCardBudgetUsage()

  return (
    <div className="flex flex-col gap-3">
      <PageHeader
        title="Presupuestos por tarjeta"
        aside={
          <Button href="/credit-cards" plain>
            <ArrowLeftIcon />
            Volver a Tarjetas
          </Button>
        }
      >
        Categorías ligadas a cada plástico (etiqueta visual) y gasto del mes en esas categorías.
      </PageHeader>

      {!usageResult.ok ? (
        <Notice tone="danger">No se pudieron cargar los vínculos: {usageResult.error}</Notice>
      ) : (
        <CreditCardBudgetUsageView groups={usageResult.groups} />
      )}
    </div>
  )
}
