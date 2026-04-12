import { AddCategoryForm } from "@/components/add-category-form"
import { CategoryIcon } from "@/components/category-icon"
import { DeleteCategoryButton } from "@/components/delete-category-button"
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
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Categorías
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Predefinidas al crear tu cuenta; podés agregar las tuyas.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <AddCategoryForm />

        <section
          className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6"
          aria-labelledby="cat-list-heading"
        >
          <h2 id="cat-list-heading" className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Tus categorías
          </h2>
          <ul className="mt-4 flex flex-col gap-2">
            {categories.map((c) => (
              <li
                key={c.id}
                className="flex items-center gap-3 rounded-xl border border-zinc-100 bg-zinc-50/80 px-3 py-3 dark:border-zinc-800 dark:bg-zinc-950/50"
              >
                <span
                  className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white dark:bg-zinc-900"
                  style={{ color: c.color }}
                >
                  <CategoryIcon name={c.icon} className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {c.name}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {c.kind === "income" ? "Ingreso" : "Gasto"}
                    {c.is_system ? " · Sistema" : ""}
                  </p>
                </div>
                <DeleteCategoryButton id={c.id} isSystem={c.is_system} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
