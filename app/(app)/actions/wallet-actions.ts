"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { DEFAULT_CATEGORIES } from "@/lib/data/default-categories"
import { currentMonthRange, normalizeMonthStartInput } from "@/lib/dates/month"
import { resolveCategoryIconKey } from "@/lib/lucide-category-icon"

export async function ensureDefaultCategories() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from("categories").update({ is_system: false }).eq("user_id", user.id).eq("is_system", true)

  const { count, error: countError } = await supabase
    .from("categories")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
  if (countError) return
  if (count && count > 0) return
  const rows = DEFAULT_CATEGORIES.map((c) => ({
    name: c.name,
    kind: c.kind,
    color: c.color,
    icon: c.icon,
    user_id: user.id,
    is_system: false,
  }))
  await supabase.from("categories").insert(rows)
}

const transactionSchema = z.object({
  categoryId: z.string().uuid(),
  amount: z.coerce.number().positive("El monto debe ser mayor a 0"),
  kind: z.enum(["expense", "income"]),
  note: z.string().max(500).optional(),
  occurredAt: z.string().optional(),
})

export type ActionResult = { error?: string, success?: boolean }

export async function addTransaction(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  const parsed = transactionSchema.safeParse({
    categoryId: formData.get("categoryId"),
    amount: formData.get("amount"),
    kind: formData.get("kind"),
    note: formData.get("note") || undefined,
    occurredAt: formData.get("occurredAt") || undefined,
  })
  if (!parsed.success) {
    const msg = Object.values(parsed.error.flatten().fieldErrors).flat()[0]
    return { error: msg ?? "Datos inválidos" }
  }

  const { data: cat } = await supabase
    .from("categories")
    .select("kind")
    .eq("id", parsed.data.categoryId)
    .eq("user_id", user.id)
    .single()

  if (!cat || cat.kind !== parsed.data.kind) {
    return { error: "La categoría no coincide con el tipo de movimiento" }
  }

  const occurred =
    parsed.data.occurredAt && parsed.data.occurredAt.length >= 10
      ? parsed.data.occurredAt.slice(0, 10)
      : new Date().toISOString().slice(0, 10)

  const { error } = await supabase.from("transactions").insert({
    user_id: user.id,
    category_id: parsed.data.categoryId,
    amount: parsed.data.amount,
    kind: parsed.data.kind,
    note: parsed.data.note?.trim() || null,
    occurred_at: occurred,
  })

  if (error) return { error: error.message }

  revalidatePath("/dashboard")
  revalidatePath("/transactions")
  revalidatePath("/budgets")
  return { success: true }
}

export async function deleteTransaction(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) return { error: error.message }
  revalidatePath("/dashboard")
  revalidatePath("/transactions")
  revalidatePath("/budgets")
  return { success: true }
}

const categorySchema = z.object({
  name: z.string().min(1, "Nombre requerido").max(80),
  kind: z.enum(["expense", "income"]),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color inválido"),
  icon: z.string().min(1).max(96),
})

export async function addCategory(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    kind: formData.get("kind"),
    color: formData.get("color"),
    icon: formData.get("icon"),
  })
  if (!parsed.success) {
    const msg = Object.values(parsed.error.flatten().fieldErrors).flat()[0]
    return { error: msg ?? "Datos inválidos" }
  }

  const iconKey = resolveCategoryIconKey(parsed.data.icon)
  if (!iconKey) {
    return {
      error:
        "Ícono no válido. Usá un nombre de Lucide (https://lucide.dev/icons/), en inglés y con guiones o en PascalCase.",
    }
  }

  const { error } = await supabase.from("categories").insert({
    user_id: user.id,
    name: parsed.data.name.trim(),
    kind: parsed.data.kind,
    color: parsed.data.color,
    icon: iconKey,
    is_system: false,
  })

  if (error) return { error: error.message }
  revalidatePath("/categories")
  revalidatePath("/transactions")
  revalidatePath("/dashboard")
  revalidatePath("/budgets")
  return { success: true }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  const { data: row } = await supabase.from("categories").select("id").eq("id", id).eq("user_id", user.id).single()

  if (!row) return { error: "Categoría no encontrada" }

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) {
    if (error.code === "23503") {
      return { error: "Hay movimientos con esta categoría. Cambiá o borrá esos movimientos primero." }
    }
    return { error: error.message }
  }
  revalidatePath("/categories")
  revalidatePath("/transactions")
  revalidatePath("/dashboard")
  revalidatePath("/budgets")
  return { success: true }
}

const updateCategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Nombre requerido").max(80),
  kind: z.enum(["expense", "income"]),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color inválido"),
  icon: z.string().min(1).max(96),
})

export async function updateCategory(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  const parsed = updateCategorySchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    kind: formData.get("kind"),
    color: formData.get("color"),
    icon: formData.get("icon"),
  })
  if (!parsed.success) {
    const msg = Object.values(parsed.error.flatten().fieldErrors).flat()[0]
    return { error: msg ?? "Datos inválidos" }
  }

  const { data: existing } = await supabase
    .from("categories")
    .select("id")
    .eq("id", parsed.data.id)
    .eq("user_id", user.id)
    .single()

  if (!existing) return { error: "Categoría no encontrada" }

  const iconKey = resolveCategoryIconKey(parsed.data.icon)
  if (!iconKey) {
    return {
      error:
        "Ícono no válido. Usá un nombre de Lucide (https://lucide.dev/icons/), en inglés y con guiones o en PascalCase.",
    }
  }

  const { error } = await supabase
    .from("categories")
    .update({
      name: parsed.data.name.trim(),
      kind: parsed.data.kind,
      color: parsed.data.color,
      icon: iconKey,
    })
    .eq("id", parsed.data.id)
    .eq("user_id", user.id)

  if (error) return { error: error.message }
  revalidatePath("/categories")
  revalidatePath("/transactions")
  revalidatePath("/dashboard")
  revalidatePath("/budgets")
  return { success: true }
}

const budgetSchema = z.object({
  categoryId: z.string().uuid(),
  amountLimit: z.coerce.number().positive("El límite debe ser mayor a 0"),
  monthStart: z.string().optional(),
})

export async function upsertBudget(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  const parsed = budgetSchema.safeParse({
    categoryId: formData.get("categoryId"),
    amountLimit: formData.get("amountLimit"),
    monthStart: formData.get("monthStart") || undefined,
  })
  if (!parsed.success) {
    const msg = Object.values(parsed.error.flatten().fieldErrors).flat()[0]
    return { error: msg ?? "Datos inválidos" }
  }

  const { data: cat } = await supabase
    .from("categories")
    .select("kind")
    .eq("id", parsed.data.categoryId)
    .eq("user_id", user.id)
    .single()

  if (!cat || cat.kind !== "expense") {
    return { error: "Solo categorías de gasto pueden tener presupuesto" }
  }

  const monthStart = normalizeMonthStartInput(parsed.data.monthStart)

  const { data: existing } = await supabase
    .from("budgets")
    .select("id")
    .eq("user_id", user.id)
    .eq("category_id", parsed.data.categoryId)
    .eq("month_start", monthStart)
    .maybeSingle()

  if (existing?.id) {
    const { error } = await supabase
      .from("budgets")
      .update({ amount_limit: parsed.data.amountLimit })
      .eq("id", existing.id)
      .eq("user_id", user.id)
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase.from("budgets").insert({
      user_id: user.id,
      category_id: parsed.data.categoryId,
      amount_limit: parsed.data.amountLimit,
      month_start: monthStart,
    })
    if (error) return { error: error.message }
  }
  revalidatePath("/dashboard")
  revalidatePath("/budgets")
  return { success: true }
}

export async function deleteBudget(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  const { error } = await supabase
    .from("budgets")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) return { error: error.message }
  revalidatePath("/dashboard")
  revalidatePath("/budgets")
  return { success: true }
}

export async function getBudgetAlertsForUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { start, end, monthStart } = currentMonthRange()

  const { data: budgets } = await supabase
    .from("budgets")
    .select(
      `
      id,
      amount_limit,
      month_start,
      category:categories ( id, name, color, icon )
    `
    )
    .eq("user_id", user.id)
    .eq("month_start", monthStart)

  if (!budgets?.length) return []

  const { data: tx } = await supabase
    .from("transactions")
    .select("category_id, amount")
    .eq("user_id", user.id)
    .eq("kind", "expense")
    .gte("occurred_at", start)
    .lte("occurred_at", end)

  const spentByCategory = new Map<string, number>()
  for (const t of tx ?? []) {
    const prev = spentByCategory.get(t.category_id) ?? 0
    spentByCategory.set(t.category_id, prev + Number(t.amount))
  }

  return budgets.flatMap((b) => {
    const raw = b.category as unknown
    const cat = (Array.isArray(raw) ? raw[0] : raw) as
      | {
          id: string
          name: string
          color: string
          icon: string
        }
      | null
      | undefined
    if (!cat?.id) return []
    const spent = spentByCategory.get(cat.id) ?? 0
    const limit = Number(b.amount_limit)
    const ratio = limit > 0 ? spent / limit : 0
    let level: "ok" | "warn" | "over" = "ok"
    if (ratio >= 1) level = "over"
    else if (ratio >= 0.8) level = "warn"
    return [
      {
        budgetId: b.id,
        categoryName: cat.name,
        color: cat.color,
        icon: cat.icon,
        spent,
        limit,
        ratio,
        level,
      },
    ]
  })
}
