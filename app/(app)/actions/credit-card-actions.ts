"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import {
  formatExpMmYy,
  normalizePanDigits,
  parseExpiryInput,
  panToStoredParts,
} from "@/lib/credit-card/format"
import { isValidLuhnPan } from "@/lib/credit-card/luhn"
import { getWalletAppMonthRange } from "@/lib/dates/wallet-app-month"
import { createClient } from "@/lib/supabase/server"
import type { ActionResult } from "@/app/(app)/actions/wallet-actions"
import { resolveEffectiveLimit, type BudgetLimitVersion } from "@/lib/budgets/limits"
import { fetchExpenseSumByCategory } from "@/lib/budgets/spent"
import { roundMoney } from "@/lib/format/money"
import type {
  BudgetLinkedToCardRow,
  CreditCardBudgetUsageGroup,
  CreditCardListItem,
} from "@/lib/types/wallet"

const revalidateCreditCardPaths = () => {
  revalidatePath("/credit-cards")
  revalidatePath("/credit-cards/vinculos")
  revalidatePath("/budgets")
  revalidatePath("/dashboard")
}

const createCreditCardSchema = z.object({
  pan: z.string().min(1, "Ingresá el número de tarjeta"),
  holderName: z.string().trim().min(1, "Ingresá el nombre del titular"),
  expiry: z.string().trim().min(4, "Ingresá vencimiento MM/AA"),
})

export async function createCreditCard(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  const parsed = createCreditCardSchema.safeParse({
    pan: formData.get("pan"),
    holderName: formData.get("holderName"),
    expiry: formData.get("expiry"),
  })
  if (!parsed.success) {
    const msg = Object.values(parsed.error.flatten().fieldErrors).flat()[0]
    return { error: msg ?? "Datos inválidos" }
  }

  const pan = normalizePanDigits(parsed.data.pan)
  if (pan.length !== 16) return { error: "El número debe tener 16 dígitos" }
  if (!isValidLuhnPan(pan)) return { error: "El número de tarjeta no es válido" }

  const parts = panToStoredParts(pan)
  if (!parts) return { error: "El número de tarjeta no es válido" }

  const exp = parseExpiryInput(parsed.data.expiry)
  if (!exp) return { error: "Vencimiento inválido (usá MM/AA)" }

  const { error } = await supabase.from("credit_cards").insert({
    user_id: user.id,
    bin: parts.bin,
    last4: parts.last4,
    holder_first_name: parsed.data.holderName.trim(),
    holder_last_name: "",
    exp_month: exp.expMonth,
    exp_year: exp.expYear,
    updated_at: new Date().toISOString(),
  })

  if (error) {
    if (error.code === "23505") {
      return { error: "Ya tenés registrada una tarjeta con esos dígitos" }
    }
    return { error: error.message }
  }
  revalidateCreditCardPaths()
  return { success: true }
}

const updateCreditCardSchema = z.object({
  creditCardId: z.string().uuid(),
  pan: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : v),
    z.string().optional()
  ),
  holderName: z.string().trim().min(1, "Ingresá el nombre del titular"),
  expiry: z.string().trim().min(4, "Ingresá vencimiento MM/AA"),
})

export async function updateCreditCard(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  const parsed = updateCreditCardSchema.safeParse({
    creditCardId: formData.get("creditCardId"),
    pan: formData.get("pan"),
    holderName: formData.get("holderName"),
    expiry: formData.get("expiry"),
  })
  if (!parsed.success) {
    const msg = Object.values(parsed.error.flatten().fieldErrors).flat()[0]
    return { error: msg ?? "Datos inválidos" }
  }

  const { data: existing } = await supabase
    .from("credit_cards")
    .select("id, bin, last4")
    .eq("id", parsed.data.creditCardId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (!existing?.id) return { error: "Tarjeta no encontrada" }

  let bin = existing.bin as string
  let last4 = existing.last4 as string
  const rawPan = parsed.data.pan != null ? String(parsed.data.pan).trim() : ""
  if (rawPan !== "") {
    const next = normalizePanDigits(rawPan)
    if (next.length !== 16) return { error: "El número debe tener 16 dígitos" }
    if (!isValidLuhnPan(next)) return { error: "El número de tarjeta no es válido" }
    const parts = panToStoredParts(next)
    if (!parts) return { error: "El número de tarjeta no es válido" }
    bin = parts.bin
    last4 = parts.last4
  }

  const exp = parseExpiryInput(parsed.data.expiry)
  if (!exp) return { error: "Vencimiento inválido (usá MM/AA)" }

  const { error } = await supabase
    .from("credit_cards")
    .update({
      bin,
      last4,
      holder_first_name: parsed.data.holderName.trim(),
      holder_last_name: "",
      exp_month: exp.expMonth,
      exp_year: exp.expYear,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.creditCardId)
    .eq("user_id", user.id)

  if (error) {
    if (error.code === "23505") {
      return { error: "Ya tenés registrada una tarjeta con esos dígitos" }
    }
    return { error: error.message }
  }
  revalidateCreditCardPaths()
  return { success: true }
}

export async function deleteCreditCard(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  const { count, error: countError } = await supabase
    .from("budgets")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("credit_card_id", id)

  if (countError) return { error: countError.message }
  if (count != null && count > 0) {
    return {
      error:
        "Esta tarjeta está vinculada a presupuestos. Desvinculala desde Presupuestos y volvé a intentar.",
    }
  }

  const { data: existing } = await supabase
    .from("credit_cards")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle()
  if (!existing) return { error: "Tarjeta no encontrada" }

  const { error } = await supabase.from("credit_cards").delete().eq("id", id).eq("user_id", user.id)

  if (error) return { error: error.message }
  revalidateCreditCardPaths()
  return { success: true }
}

const rowToListItem = (row: {
  id: string
  bin: string
  last4: string
  holder_first_name: string
  holder_last_name: string
  exp_month: number
  exp_year: number
}): CreditCardListItem => ({
  id: row.id,
  holder_first_name: row.holder_first_name,
  holder_last_name: row.holder_last_name,
  bin: row.bin,
  last4: row.last4,
  exp_month: row.exp_month,
  exp_year: row.exp_year,
  exp_label: formatExpMmYy(row.exp_month, row.exp_year),
})

export type CreditCardListResult =
  | { ok: true, cards: CreditCardListItem[] }
  | { ok: false, error: string }

export async function listCreditCardsForUser(): Promise<CreditCardListResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "No autenticado" }

  const { data, error } = await supabase
    .from("credit_cards")
    .select("id, bin, last4, holder_first_name, holder_last_name, exp_month, exp_year")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    return { ok: false, error: error.message }
  }
  return { ok: true, cards: (data ?? []).map(rowToListItem) }
}

export type CreditCardBudgetUsageResult =
  | { ok: true, groups: CreditCardBudgetUsageGroup[] }
  | { ok: false, error: string }

export async function getCreditCardBudgetUsage(): Promise<CreditCardBudgetUsageResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "No autenticado" }

  const cardsResult = await listCreditCardsForUser()
  if (!cardsResult.ok) return cardsResult
  const cards = cardsResult.cards
  if (cards.length === 0) return { ok: true, groups: [] }

  const { start, end, monthStart } = await getWalletAppMonthRange()

  const { data: budgetRows, error } = await supabase
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
    .not("credit_card_id", "is", null)

  if (error) {
    return { ok: false, error: error.message }
  }

  const rows = budgetRows ?? []
  if (rows.length === 0) {
    return {
      ok: true,
      groups: cards.map((card) => ({ card, budgets: [], totalSpentOnCard: 0 })),
    }
  }

  const budgetIds = rows.map((b) => b.id as string)
  const { data: limitRows, error: limitError } = await supabase
    .from("budget_limits")
    .select("budget_id, month_start, amount_limit")
    .in("budget_id", budgetIds)
    .order("month_start", { ascending: true })

  if (limitError) {
    return { ok: false, error: limitError.message }
  }

  const versionsByBudget = new Map<string, BudgetLimitVersion[]>()
  for (const row of limitRows ?? []) {
    const bid = row.budget_id as string
    const list = versionsByBudget.get(bid) ?? []
    list.push({
      monthStart: String(row.month_start).slice(0, 10),
      amountLimit: Number(row.amount_limit),
    })
    versionsByBudget.set(bid, list)
  }

  const spentByCategory = await fetchExpenseSumByCategory(supabase, user.id, start, end)

  const byCard = new Map<string, BudgetLinkedToCardRow[]>()

  for (const b of rows) {
    const cid = b.credit_card_id as string | null
    if (!cid) continue
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
    if (!cat?.id) continue

    const versions = versionsByBudget.get(b.id as string) ?? []
    const amountLimit = resolveEffectiveLimit(versions, monthStart)
    if (amountLimit == null) continue

    const spent = spentByCategory.get(cat.id) ?? 0
    const row: BudgetLinkedToCardRow = {
      budgetId: b.id as string,
      categoryId: cat.id,
      categoryName: cat.name,
      color: cat.color,
      icon: cat.icon,
      amountLimit,
      spent,
      monthStart,
      paymentDay: Math.min(31, Math.max(1, Number(b.payment_day) || 1)),
    }
    const list = byCard.get(cid) ?? []
    list.push(row)
    byCard.set(cid, list)
  }

  for (const list of byCard.values()) {
    list.sort((a, b) => a.categoryName.localeCompare(b.categoryName, "es"))
  }

  return {
    ok: true,
    groups: cards.map((card) => {
      const budgets = byCard.get(card.id) ?? []
      const totalSpentOnCard = roundMoney(budgets.reduce((sum, r) => sum + r.spent, 0))
      return { card, budgets, totalSpentOnCard }
    }),
  }
}
