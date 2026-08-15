import { ArrowsRightLeftIcon } from "@heroicons/react/16/solid"
import { AddCreditCardForm } from "@/components/add-credit-card-form"
import { DeleteCreditCardButton } from "@/components/delete-credit-card-button"
import { EditCreditCardDialog } from "@/components/edit-credit-card-dialog"
import { Button } from "@/components/ui/button"
import { Heading, Subheading } from "@/components/ui/heading"
import { Text } from "@/components/ui/text"
import { listCreditCardsForUser } from "@/app/(app)/actions/credit-card-actions"
import { holderDisplayFull } from "@/lib/credit-card/format"
import { createClient } from "@/lib/supabase/server"

export default async function CreditCardsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const cards = await listCreditCardsForUser()

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Heading>Tarjetas</Heading>
          <Text className="mt-1">
            Registrá plásticos para asociarlos a presupuestos y ver en qué tarjeta cae cada pago mensual.
          </Text>
        </div>
        <Button href="/credit-cards/vinculos" outline className="self-start sm:self-auto">
          <ArrowsRightLeftIcon />
          Presupuestos por tarjeta
        </Button>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <AddCreditCardForm />

        <section
          className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6"
          aria-labelledby="cc-list-heading"
        >
          <Subheading id="cc-list-heading" level={2}>
            Tus tarjetas
          </Subheading>
          {cards.length === 0 ? (
            <Text className="mt-4">
              Todavía no hay tarjetas. Usá el formulario para agregar la primera y vincularla desde Presupuestos.
            </Text>
          ) : (
            <ul className="mt-4 flex flex-col gap-2">
              {cards.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center gap-3 rounded-xl border border-zinc-100 bg-zinc-50/80 px-3 py-3 dark:border-zinc-800 dark:bg-zinc-950/50"
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
          )}
        </section>
      </div>
    </div>
  )
}
