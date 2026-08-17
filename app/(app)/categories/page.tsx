import { AddCategoryForm } from "@/components/add-category-form"
import { CategoryIcon } from "@/components/category-icon"
import { DeleteCategoryButton } from "@/components/delete-category-button"
import { EditCategoryDialog } from "@/components/edit-category-dialog"
import { PageHeader } from "@/components/page-header"
import { BentoTile } from "@/components/bento-tile"
import { Badge } from "@/components/ui/badge"
import { Subheading } from "@/components/ui/heading"
import { createClient } from "@/lib/supabase/server"
import type { CategoryRow } from "@/lib/types/wallet"

export default async function CategoriesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", user.id)
    .order("kind")
    .order("name")

  const categories = (data ?? []) as CategoryRow[]

  return (
    <div className="flex flex-col gap-3">
      <PageHeader title="Categorías">
        Predefinidas al crear tu cuenta; podés agregar, editar o eliminar cualquiera.
      </PageHeader>

      <div className="grid gap-3 lg:grid-cols-2">
        <AddCategoryForm />

        <BentoTile tone="paper" as="section" aria-labelledby="cat-list-heading">
          <Subheading id="cat-list-heading" level={2}>
            Tus categorías
          </Subheading>
          <ul className="mt-4 flex flex-col gap-2">
            {categories.map((c) => (
              <li
                key={c.id}
                className="glass-inset glass-interactive flex items-center gap-3 rounded-2xl px-3 py-3 hover:bg-forest/8"
              >
                <span
                  className="glass-chip flex size-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ color: c.color }}
                >
                  <CategoryIcon name={c.icon} className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{c.name}</p>
                  <Badge color={c.kind === "income" ? "emerald" : "zinc"} className="mt-1">
                    {c.kind === "income" ? "Ingreso" : "Gasto"}
                  </Badge>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <EditCategoryDialog category={c} />
                  <DeleteCategoryButton id={c.id} />
                </div>
              </li>
            ))}
          </ul>
        </BentoTile>
      </div>
    </div>
  )
}
