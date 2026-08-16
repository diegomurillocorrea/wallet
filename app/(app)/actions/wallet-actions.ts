"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import type { BudgetAlertRow, BudgetCategoryMovement } from "@/lib/types/wallet"
import { DEFAULT_CATEGORIES } from "@/lib/data/default-categories"
import {
  clampIsoDateToRange,
  normalizeMonthStartInput,
  parseIsoDateStrict,
  parsePaymentDayFromDateInput,
} from "@/lib/dates/month"
import { getWalletAppMonthRange, WALLET_APP_MONTH_COOKIE } from "@/lib/dates/wallet-app-month"
import { todayInElSalvador } from "@/lib/dates/el-salvador"
import { resolveCategoryIconKey } from "@/lib/lucide-category-icon"
import { formatExpMmYy, holderShortFromCard } from "@/lib/credit-card/format"
import { isValidMoneyAmount, roundMoney } from "@/lib/format/money"
import {
  planLimitEdit,
  resolveEffectiveLimit,
  type BudgetLimitVersion,
} from "@/lib/budgets/limits"
import { fetchExpenseSumByCategory } from "@/lib/budgets/spent"

const parseCreditCardIdFromForm = (fd: FormData): string | undefined => {
  const v = fd.get("creditCardId")
  if (v == null) return undefined
  const s = String(v).trim()
  return s === "" ? undefined : s
}

const resolveOwnedCreditCardId = async (
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  raw: string | undefined
): Promise<string | null | { error: string }> => {
  if (raw == null) return null
  const { data } = await supabase
    .from("credit_cards")
    .select("id")
    .eq("id", raw)
    .eq("user_id", userId)
    .maybeSingle()
  if (!data?.id) return { error: "La tarjeta seleccionada no es válida" }
  return raw
}

const moneySchema = z.coerce
  .number()
  .refine((n) => isValidMoneyAmount(n), "El monto debe ser mayor a 0, con máximo 2 decimales")

const fetchBudgetLimitVersions = async (
  supabase: Awaited<ReturnType<typeof createClient>>,
  budgetIds: string[]
): Promise<Map<string, BudgetLimitVersion[]>> => {
  const map = new Map<string, BudgetLimitVersion[]>()
  if (budgetIds.length === 0) return map
  const { data } = await supabase
    .from("budget_limits")
    .select("budget_id, month_start, amount_limit")
    .in("budget_id", budgetIds)
    .order("month_start", { ascending: true })
  for (const row of data ?? []) {
    const bid = row.budget_id as string
    const list = map.get(bid) ?? []
    list.push({
      monthStart: String(row.month_start).slice(0, 10),
      amountLimit: Number(row.amount_limit),
    })
    map.set(bid, list)
  }
  return map
}

const upsertBudgetLimitRows = async (
  supabase: Awaited<ReturnType<typeof createClient>>,
  budgetId: string,
  upserts: BudgetLimitVersion[]
): Promise<{ error?: string }> => {
  for (const u of upserts) {
    const { data: existing } = await supabase
      .from("budget_limits")
      .select("id")
      .eq("budget_id", budgetId)
      .eq("month_start", u.monthStart)
      .maybeSingle()

    if (existing?.id) {
      const { error } = await supabase
        .from("budget_limits")
        .update({ amount_limit: u.amountLimit })
        .eq("id", existing.id)
      if (error) return { error: error.message }
    } else {
      const { error } = await supabase.from("budget_limits").insert({
        budget_id: budgetId,
        month_start: u.monthStart,
        amount_limit: u.amountLimit,
      })
      if (error) return { error: error.message }
    }
  }
  return {}
}

export async function ensureDefaultCategories() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from("categories").update({ is_system: false }).eq("user_id", user.id).eq("is_system", true)

  const { data: settings } = await supabase
    .from("user_settings")
    .select("default_categories_seeded")
    .eq("user_id", user.id)
    .maybeSingle()

  if (settings?.default_categories_seeded) return

  const { count, error: countError } = await supabase
    .from("categories")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
  if (countError) return

  if (!count || count === 0) {
    const rows = DEFAULT_CATEGORIES.map((c) => ({
      name: c.name,
      kind: c.kind,
      color: c.color,
      icon: c.icon,
      user_id: user.id,
      is_system: false,
    }))
    const { error: insertError } = await supabase.from("categories").insert(rows)
    if (insertError) return
  }

  await supabase.from("user_settings").upsert(
    {
      user_id: user.id,
      default_categories_seeded: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  )
}

const transactionSchema = z.object({
  categoryId: z.string().uuid(),
  amount: moneySchema,
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

  let occurred: string
  if (parsed.data.occurredAt) {
    const strict = parseIsoDateStrict(parsed.data.occurredAt)
    if (!strict) return { error: "La fecha no es válida" }
    occurred = strict
  } else {
    occurred = todayInElSalvador()
  }

  const constrain =
    formData.get("constrainToAppMonth") === "1" ||
    formData.get("constrainToAppMonth") === "true"

  if (constrain) {
    const { start, end } = await getWalletAppMonthRange()
    occurred = clampIsoDateToRange(occurred, start, end)
  }

  const { error } = await supabase.from("transactions").insert({
    user_id: user.id,
    category_id: parsed.data.categoryId,
    amount: roundMoney(parsed.data.amount),
    kind: parsed.data.kind,
    note: parsed.data.note?.trim() || null,
    occurred_at: occurred,
  })

  if (error) return { error: error.message }

  revalidatePath("/dashboard")
  revalidatePath("/transactions")
  revalidatePath("/budgets")
  revalidatePath("/credit-cards/vinculos")
  return { success: true }
}

const updateTransactionSchema = z.object({
  transactionId: z.string().uuid(),
  amount: moneySchema,
  note: z.string().max(500).optional(),
  occurredAt: z.string().optional(),
  categoryId: z.string().uuid().optional(),
})

export async function updateTransaction(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  const rawCategoryId = formData.get("categoryId")
  const parsed = updateTransactionSchema.safeParse({
    transactionId: formData.get("transactionId"),
    amount: formData.get("amount"),
    note: formData.get("note") || undefined,
    occurredAt: formData.get("occurredAt") || undefined,
    categoryId:
      rawCategoryId != null && String(rawCategoryId).trim() !== ""
        ? String(rawCategoryId)
        : undefined,
  })
  if (!parsed.success) {
    const msg = Object.values(parsed.error.flatten().fieldErrors).flat()[0]
    return { error: msg ?? "Datos inválidos" }
  }

  const { data: existing } = await supabase
    .from("transactions")
    .select("id, kind, category_id, occurred_at")
    .eq("id", parsed.data.transactionId)
    .eq("user_id", user.id)
    .maybeSingle()
  if (!existing) return { error: "Movimiento no encontrado" }

  let categoryId = existing.category_id as string
  let kind = existing.kind as string

  if (parsed.data.categoryId) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id, kind")
      .eq("id", parsed.data.categoryId)
      .eq("user_id", user.id)
      .maybeSingle()
    if (!cat) return { error: "Categoría no encontrada" }
    if (cat.kind !== existing.kind) {
      return { error: "La categoría debe ser del mismo tipo que el movimiento" }
    }
    categoryId = cat.id
    kind = cat.kind
  }

  let occurred = String(existing.occurred_at).slice(0, 10)
  if (parsed.data.occurredAt) {
    const strict = parseIsoDateStrict(parsed.data.occurredAt)
    if (!strict) return { error: "La fecha no es válida" }
    occurred = strict
  }

  if (formData.get("constrainToAppMonth") === "1") {
    const { start, end } = await getWalletAppMonthRange()
    occurred = clampIsoDateToRange(occurred, start, end)
  }

  const { error: updateError } = await supabase
    .from("transactions")
    .update({
      amount: roundMoney(parsed.data.amount),
      note: parsed.data.note?.trim() || null,
      occurred_at: occurred,
      category_id: categoryId,
      kind,
    })
    .eq("id", parsed.data.transactionId)
    .eq("user_id", user.id)

  if (updateError) return { error: updateError.message }

  revalidatePath("/dashboard")
  revalidatePath("/transactions")
  revalidatePath("/budgets")
  revalidatePath("/credit-cards/vinculos")
  return { success: true }
}

export async function deleteTransaction(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  const { data: existing } = await supabase
    .from("transactions")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle()
  if (!existing) return { error: "Movimiento no encontrado" }

  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) return { error: error.message }
  revalidatePath("/dashboard")
  revalidatePath("/transactions")
  revalidatePath("/budgets")
  revalidatePath("/credit-cards/vinculos")
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

  if (error) {
    if (error.code === "23505") {
      return { error: "Ya existe una categoría con ese nombre y tipo" }
    }
    return { error: error.message }
  }
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

  const { count: budgetCount } = await supabase
    .from("budgets")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("category_id", id)

  if (budgetCount != null && budgetCount > 0) {
    return {
      error: "Hay un presupuesto con esta categoría. Eliminalo desde Presupuestos primero.",
    }
  }

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
    .select("id, kind")
    .eq("id", parsed.data.id)
    .eq("user_id", user.id)
    .single()

  if (!existing) return { error: "Categoría no encontrada" }

  if (existing.kind !== parsed.data.kind) {
    const { count: txCount } = await supabase
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("category_id", parsed.data.id)
    if (txCount != null && txCount > 0) {
      return { error: "No se puede cambiar el tipo: hay movimientos con esta categoría" }
    }
    const { count: budgetCount } = await supabase
      .from("budgets")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("category_id", parsed.data.id)
    if (budgetCount != null && budgetCount > 0) {
      return { error: "No se puede cambiar el tipo: hay un presupuesto con esta categoría" }
    }
  }

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

  if (error) {
    if (error.code === "23505") {
      return { error: "Ya existe una categoría con ese nombre y tipo" }
    }
    return { error: error.message }
  }
  revalidatePath("/categories")
  revalidatePath("/transactions")
  revalidatePath("/dashboard")
  revalidatePath("/budgets")
  return { success: true }
}

const budgetSchema = z.object({
  categoryId: z.string().uuid(),
  amountLimit: moneySchema,
  paymentDate: z.string().min(10, "Elegí el día de pago en el calendario"),
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
    paymentDate: formData.get("paymentDate"),
  })
  if (!parsed.success) {
    const msg = Object.values(parsed.error.flatten().fieldErrors).flat()[0]
    return { error: msg ?? "Datos inválidos" }
  }

  const paymentDay = parsePaymentDayFromDateInput(parsed.data.paymentDate)
  if (paymentDay == null) {
    return { error: "La fecha de día de pago no es válida" }
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

  const creditResolved = await resolveOwnedCreditCardId(
    supabase,
    user.id,
    parseCreditCardIdFromForm(formData)
  )
  if (creditResolved != null && typeof creditResolved === "object" && "error" in creditResolved) {
    return creditResolved
  }
  const creditCardId = typeof creditResolved === "string" ? creditResolved : null

  const { monthStart } = await getWalletAppMonthRange()
  const amount = roundMoney(parsed.data.amountLimit)

  const { data: existing } = await supabase
    .from("budgets")
    .select("id")
    .eq("user_id", user.id)
    .eq("category_id", parsed.data.categoryId)
    .maybeSingle()

  let budgetId = existing?.id as string | undefined

  if (budgetId) {
    const { error } = await supabase
      .from("budgets")
      .update({
        payment_day: paymentDay,
        credit_card_id: creditCardId,
      })
      .eq("id", budgetId)
      .eq("user_id", user.id)
    if (error) return { error: error.message }

    const versions = (await fetchBudgetLimitVersions(supabase, [budgetId])).get(budgetId) ?? []
    const { upserts } = planLimitEdit(versions, monthStart, amount)
    const limitResult = await upsertBudgetLimitRows(supabase, budgetId, upserts)
    if (limitResult.error) return { error: limitResult.error }
  } else {
    const { data: inserted, error } = await supabase
      .from("budgets")
      .insert({
        user_id: user.id,
        category_id: parsed.data.categoryId,
        payment_day: paymentDay,
        credit_card_id: creditCardId,
      })
      .select("id")
      .single()
    if (error) return { error: error.message }
    budgetId = inserted.id as string

    const { error: limitError } = await supabase.from("budget_limits").insert({
      budget_id: budgetId,
      month_start: monthStart,
      amount_limit: amount,
    })
    if (limitError) return { error: limitError.message }
  }

  revalidatePath("/dashboard")
  revalidatePath("/budgets")
  revalidatePath("/credit-cards/vinculos")
  return { success: true }
}

const updateBudgetSchema = budgetSchema.extend({
  budgetId: z.string().uuid(),
})

export async function updateBudget(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  const parsed = updateBudgetSchema.safeParse({
    budgetId: formData.get("budgetId"),
    categoryId: formData.get("categoryId"),
    amountLimit: formData.get("amountLimit"),
    paymentDate: formData.get("paymentDate"),
  })
  if (!parsed.success) {
    const msg = Object.values(parsed.error.flatten().fieldErrors).flat()[0]
    return { error: msg ?? "Datos inválidos" }
  }

  const paymentDay = parsePaymentDayFromDateInput(parsed.data.paymentDate)
  if (paymentDay == null) {
    return { error: "La fecha de día de pago no es válida" }
  }

  const { data: owned } = await supabase
    .from("budgets")
    .select("id")
    .eq("id", parsed.data.budgetId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (!owned?.id) return { error: "Presupuesto no encontrado" }

  const { data: cat } = await supabase
    .from("categories")
    .select("kind")
    .eq("id", parsed.data.categoryId)
    .eq("user_id", user.id)
    .single()

  if (!cat || cat.kind !== "expense") {
    return { error: "Solo categorías de gasto pueden tener presupuesto" }
  }

  const { data: duplicate } = await supabase
    .from("budgets")
    .select("id")
    .eq("user_id", user.id)
    .eq("category_id", parsed.data.categoryId)
    .neq("id", parsed.data.budgetId)
    .maybeSingle()

  if (duplicate?.id) {
    return { error: "Ya existe un presupuesto para esa categoría" }
  }

  const creditResolved = await resolveOwnedCreditCardId(
    supabase,
    user.id,
    parseCreditCardIdFromForm(formData)
  )
  if (creditResolved != null && typeof creditResolved === "object" && "error" in creditResolved) {
    return creditResolved
  }
  const creditCardId = typeof creditResolved === "string" ? creditResolved : null

  const { monthStart } = await getWalletAppMonthRange()
  const amount = roundMoney(parsed.data.amountLimit)

  const { error } = await supabase
    .from("budgets")
    .update({
      category_id: parsed.data.categoryId,
      payment_day: paymentDay,
      credit_card_id: creditCardId,
    })
    .eq("id", parsed.data.budgetId)
    .eq("user_id", user.id)

  if (error) return { error: error.message }

  const versions =
    (await fetchBudgetLimitVersions(supabase, [parsed.data.budgetId])).get(parsed.data.budgetId) ??
    []
  const { upserts } = planLimitEdit(versions, monthStart, amount)
  const limitResult = await upsertBudgetLimitRows(supabase, parsed.data.budgetId, upserts)
  if (limitResult.error) return { error: limitResult.error }

  revalidatePath("/dashboard")
  revalidatePath("/budgets")
  revalidatePath("/credit-cards/vinculos")
  return { success: true }
}

export async function deleteBudget(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  const { data: existing } = await supabase
    .from("budgets")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle()
  if (!existing) return { error: "Presupuesto no encontrado" }

  const { error } = await supabase
    .from("budgets")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) return { error: error.message }
  revalidatePath("/dashboard")
  revalidatePath("/budgets")
  revalidatePath("/credit-cards/vinculos")
  return { success: true }
}

export async function getBudgetAlertsForUser(): Promise<BudgetAlertRow[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { start, end, monthStart } = await getWalletAppMonthRange()

  const { data: budgets } = await supabase
    .from("budgets")
    .select(
      `
      id,
      payment_day,
      credit_card_id,
      category:categories ( id, name, color, icon )
    `
    )
    .eq("user_id", user.id)

  if (!budgets?.length) return []

  const budgetIds = budgets.map((b) => b.id as string)
  const versionsByBudget = await fetchBudgetLimitVersions(supabase, budgetIds)

  const cardIds = [
    ...new Set(
      budgets
        .map((b) => b.credit_card_id as string | null | undefined)
        .filter((id): id is string => typeof id === "string" && id.length > 0)
    ),
  ]

  const cardById = new Map<
    string,
    { last4: string, holder_first_name: string, holder_last_name: string, exp_month: number, exp_year: number }
  >()
  if (cardIds.length > 0) {
    const { data: cards } = await supabase
      .from("credit_cards")
      .select("id, last4, holder_first_name, holder_last_name, exp_month, exp_year")
      .eq("user_id", user.id)
      .in("id", cardIds)
    for (const c of cards ?? []) {
      cardById.set(c.id as string, {
        last4: c.last4 as string,
        holder_first_name: c.holder_first_name as string,
        holder_last_name: c.holder_last_name as string,
        exp_month: Number(c.exp_month),
        exp_year: Number(c.exp_year),
      })
    }
  }

  const { data: tx } = await supabase
    .from("transactions")
    .select("id, category_id, amount, note, occurred_at")
    .eq("user_id", user.id)
    .eq("kind", "expense")
    .gte("occurred_at", start)
    .lte("occurred_at", end)
    .order("occurred_at", { ascending: false })

  const spentByCategory = await fetchExpenseSumByCategory(supabase, user.id, start, end)
  const movementsByCategory = new Map<string, BudgetCategoryMovement[]>()
  for (const t of tx ?? []) {
    const categoryId = t.category_id as string
    const amount = roundMoney(Number(t.amount))
    const list = movementsByCategory.get(categoryId) ?? []
    list.push({
      id: t.id as string,
      amount,
      note: (t.note as string | null) ?? null,
      occurredAt: String(t.occurred_at).slice(0, 10),
      categoryId,
      kind: "expense",
    })
    movementsByCategory.set(categoryId, list)
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

    const versions = versionsByBudget.get(b.id as string) ?? []
    const limit = resolveEffectiveLimit(versions, monthStart)
    if (limit == null) return []

    const spent = spentByCategory.get(cat.id) ?? 0
    const ratio = limit > 0 ? spent / limit : 0
    let level: "ok" | "warn" | "over" = "ok"
    if (ratio >= 1) level = "over"
    else if (ratio >= 0.8) level = "warn"
    const cid = (b.credit_card_id as string | null | undefined) ?? null
    const crow = cid ? cardById.get(cid) : undefined
    const card =
      crow != null
        ? {
            last4: crow.last4,
            holderShort: holderShortFromCard(crow.holder_first_name, crow.holder_last_name),
            exp_label: formatExpMmYy(crow.exp_month, crow.exp_year),
          }
        : null
    return [
      {
        budgetId: b.id,
        categoryId: cat.id,
        categoryName: cat.name,
        color: cat.color,
        icon: cat.icon,
        spent,
        limit,
        ratio,
        level,
        monthStart,
        paymentDay: Math.min(31, Math.max(1, Number(b.payment_day) || 1)),
        creditCardId: cid,
        card,
        movements: movementsByCategory.get(cat.id) ?? [],
      },
    ]
  })
}

/** Persiste el mes de contexto global (cookie) y refresca vistas que lo usan */
export async function setWalletAppMonth(monthStartIsoInput: string): Promise<void> {
  const trimmed = monthStartIsoInput.trim()
  const padded = trimmed.length === 7 ? `${trimmed}-01` : trimmed.slice(0, 10)
  const normalized = normalizeMonthStartInput(padded)
  const jar = await cookies()
  jar.set(WALLET_APP_MONTH_COOKIE, normalized, {
    path: "/",
    maxAge: 60 * 60 * 24 * 400,
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  })
  revalidatePath("/dashboard")
  revalidatePath("/budgets")
  revalidatePath("/transactions")
  revalidatePath("/credit-cards/vinculos")
}
