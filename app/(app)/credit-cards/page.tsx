import { ArrowsRightLeftIcon } from "@heroicons/react/16/solid"
import { AddCreditCardForm } from "@/components/add-credit-card-form"
import { DeleteCreditCardButton } from "@/components/delete-credit-card-button"
import { EditCreditCardDialog } from "@/components/edit-credit-card-dialog"
import { PageHeader } from "@/components/page-header"
import { BentoTile } from "@/components/bento-tile"
import { Button } from "@/components/ui/button"
import { listCreditCardsForUser } from "@/app/(app)/actions/credit-card-actions"
import { holderDisplayFull } from "@/lib/credit-card/format"
import { createClient } from "@/lib/supabase/server"

export default async function CreditCardsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const cardsResult = await listCreditCardsForUser()
  const cards = cardsResult.ok ? cardsResult.cards : []

  return (
    <div className="flex flex-col gap-3">
      <PageHeader
        title="Tarjetas"
        aside={
          <Button href="/credit-cards/vinculos" outline className="self-start sm:self-auto">
            <ArrowsRightLeftIcon />
            Presupuestos por tarjeta
          </Button>
        }
      >
        Registrá plásticos como etiqueta visual: asociálos a presupuestos para ver a qué tarjeta
        está ligado cada techo de gasto.
      </PageHeader>

      {!cardsResult.ok ? (
        <p
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100"
          role="alert"
        >
          No se pudieron cargar las tarjetas: {cardsResult.error}
        </p>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-2">
        <AddCreditCardForm />

        <BentoTile tone="paper" as="section" aria-labelledby="cc-list-heading">
          <h2 id="cc-list-heading" className="font-display text-2xl uppercase tracking-tight text-ink">
            Tus tarjetas
          </h2>
          {cardsResult.ok && cards.length === 0 ? (
            <p className="mt-4 text-sm text-ink/70">
              Todavía no hay tarjetas. Usá el formulario para agregar la primera y vincularla desde Presupuestos.
            </p>
          ) : cards.length > 0 ? (
            <ul className="mt-4 flex flex-col gap-2">
              {cards.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center gap-3 rounded-2xl bg-sand/70 px-3 py-3"
                >
                  <div
                    className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-semibold tabular-nums text-emerald-700 dark:bg-zinc-900 dark:text-emerald-400"
                    aria-hidden
                  >
                    ••{c.last4}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {holderDisplayFull(c.holder_first_name, c.holder_last_name)}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Vence {c.exp_label}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <EditCreditCardDialog card={c} />
                    <DeleteCreditCardButton id={c.id} />
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </BentoTile>
      </div>
    </div>
  )
}
