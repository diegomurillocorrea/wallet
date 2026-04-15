"use server"

import { endOfMonth, format, max, min, parseISO, startOfMonth } from "date-fns"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { formatExpMmYy, normalizePanDigits, parseExpiryInput, panLast4 } from "@/lib/credit-card/format"
import { isValidLuhnPan } from "@/lib/credit-card/luhn"
import { createClient } from "@/lib/supabase/server"
import type { ActionResult } from "@/app/(app)/actions/wallet-actions"
import type {
  BudgetLinkedToCardRow,
  CreditCardBudgetUsageGroup,
  CreditCardListItem,
} from "@/lib/types/wallet"

const revalidateCreditCardPaths = () => {
  revalidatePath("/credit-cards")
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

  const exp = parseExpiryInput(parsed.data.expiry)
  if (!exp) return { error: "Vencimiento inválido (usá MM/AA)" }

  const { error } = await supabase.from("credit_cards").insert({
    user_id: user.id,
    pan,
    holder_first_name: parsed.data.holderName.trim(),
    holder_last_name: "",
    exp_month: exp.expMonth,
    exp_year: exp.expYear,
    updated_at: new Date().toISOString(),
  })

  if (error) return { error: error.message }
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
    .select("id, pan")
    .eq("id", parsed.data.creditCardId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (!existing?.id) return { error: "Tarjeta no encontrada" }

  let pan = existing.pan as string
  const rawPan = parsed.data.pan != null ? String(parsed.data.pan).trim() : ""
  if (rawPan !== "") {
    const next = normalizePanDigits(rawPan)
    if (next.length !== 16) return { error: "El número debe tener 16 dígitos" }
    if (!isValidLuhnPan(next)) return { error: "El número de tarjeta no es válido" }
    pan = next
  }

  const exp = parseExpiryInput(parsed.data.expiry)
  if (!exp) return { error: "Vencimiento inválido (usá MM/AA)" }

  const { error } = await supabase
    .from("credit_cards")
    .update({
      pan,
      holder_first_name: parsed.data.holderName.trim(),
      holder_last_name: "",
      exp_month: exp.expMonth,
      exp_year: exp.expYear,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.creditCardId)
    .eq("user_id", user.id)

  if (error) return { error: error.message }
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

  const { error } = await supabase.from("credit_cards").delete().eq("id", id).eq("user_id", user.id)

  if (error) return { error: error.message }
  revalidateCreditCardPaths()
  return { success: true }
}

const rowToListItem = (row: {
  id: string
  pan: string
  holder_first_name: string
  holder_last_name: string
  exp_month: number
  exp_year: number
}): CreditCardListItem => ({
  id: row.id,
  holder_first_name: row.holder_first_name,
  holder_last_name: row.holder_last_name,
  last4: panLast4(row.pan),
  exp_month: row.exp_month,
  exp_year: row.exp_year,
  exp_label: formatExpMmYy(row.exp_month, row.exp_year),
})

export async function listCreditCardsForUser(): Promise<CreditCardListItem[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from("credit_cards")
    .select("id, pan, holder_first_name, holder_last_name, exp_month, exp_year")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) return []
  if (!data?.length) return []
  return data.map(rowToListItem)
}

const spendKey = (categoryId: string, monthStart: string) =>
  `${categoryId}|${monthStart.slice(0, 10)}`

const boundsFromMonthStarts = (monthStarts: string[]): { start: string, end: string } | null => {
  const valid = monthStarts.map((s) => s.slice(0, 10)).filter((s) => s.length >= 10)
  if (valid.length === 0) return null
  const dates = valid.map((s) => parseISO(s))
  const earliest = min(dates)
  const latest = max(dates)
  return {
    start: format(startOfMonth(earliest), "yyyy-MM-dd"),
    end: format(endOfMonth(latest), "yyyy-MM-dd"),
  }
}

export async function getCreditCardBudgetUsage(): Promise<CreditCardBudgetUsageGroup[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const cards = await listCreditCardsForUser()
  if (cards.length === 0) return []

  const { data: budgetRows, error } = await supabase
    .from("budgets")
    .select(
      `
      id,
      amount_limit,
      month_start,
      payment_day,
      credit_card_id,
      category:categories ( id, name, color, icon )
    `
    )
    .eq("user_id", user.id)
    .not("credit_card_id", "is", null)
    .order("month_start", { ascending: false })

  if (error) {
    return cards.map((card) => ({ card, budgets: [], totalSpentOnCard: 0 }))
  }

  const rows = budgetRows ?? []
  if (rows.length === 0) {
    return cards.map((card) => ({ card, budgets: [], totalSpentOnCard: 0 }))
  }

  const bounds = boundsFromMonthStarts(rows.map((b) => b.month_start as string))
  const spentByCategoryMonth = new Map<string, number>()

  if (bounds) {
    const { data: tx } = await supabase
      .from("transactions")
      .select("category_id, amount, occurred_at")
      .eq("user_id", user.id)
      .eq("kind", "expense")
      .gte("occurred_at", bounds.start)
      .lte("occurred_at", bounds.end)

    for (const t of tx ?? []) {
      const d = parseISO(String(t.occurred_at).slice(0, 10))
      if (Number.isNaN(d.getTime())) continue
      const mk = format(startOfMonth(d), "yyyy-MM-dd")
      const key = spendKey(t.category_id as string, mk)
      const prev = spentByCategoryMonth.get(key) ?? 0
      spentByCategoryMonth.set(key, prev + Number(t.amount))
    }
  }

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
    const monthStart = String(b.month_start).slice(0, 10)
    const spent = spentByCategoryMonth.get(spendKey(cat.id, monthStart)) ?? 0
    const row: BudgetLinkedToCardRow = {
      budgetId: b.id as string,
      categoryId: cat.id,
      categoryName: cat.name,
      color: cat.color,
      icon: cat.icon,
      amountLimit: Number(b.amount_limit),
      spent,
      monthStart,
      paymentDay: Math.min(31, Math.max(1, Number(b.payment_day) || 1)),
    }
    const list = byCard.get(cid) ?? []
    list.push(row)
    byCard.set(cid, list)
  }

  for (const list of byCard.values()) {
    list.sort(
      (a, b) =>
        b.monthStart.localeCompare(a.monthStart) || a.categoryName.localeCompare(b.categoryName, "es")
    )
  }

  return cards.map((card) => {
    const budgets = byCard.get(card.id) ?? []
    const totalSpentOnCard = budgets.reduce((sum, r) => sum + r.spent, 0)
    return { card, budgets, totalSpentOnCard }
  })
}
