import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  planLimitEdit,
  paymentDayInMonth,
  paymentDayLabel,
  resolveEffectiveLimit,
} from "./limits"
import { panToStoredParts } from "../credit-card/format"
import { isValidLuhnPan } from "../credit-card/luhn"
import { parseIsoDateStrict } from "../dates/month"
import { isValidMoneyAmount, remainingToPay, roundMoney } from "../format/money"

describe("resolveEffectiveLimit", () => {
  const versions = [
    { monthStart: "2026-07-01", amountLimit: 300 },
    { monthStart: "2026-08-01", amountLimit: 200 },
  ]

  it("returns null before the first version", () => {
    assert.equal(resolveEffectiveLimit(versions, "2026-06-01"), null)
  })

  it("uses the exact month when present", () => {
    assert.equal(resolveEffectiveLimit(versions, "2026-07-01"), 300)
    assert.equal(resolveEffectiveLimit(versions, "2026-08-01"), 200)
  })

  it("carries forward the last version", () => {
    assert.equal(resolveEffectiveLimit(versions, "2026-09-01"), 200)
  })

  it("returns null for empty versions", () => {
    assert.equal(resolveEffectiveLimit([], "2026-08-01"), null)
  })
})

describe("planLimitEdit", () => {
  it("isolates a past-month edit and materializes the next month", () => {
    const versions = [{ monthStart: "2026-01-01", amountLimit: 300 }]
    const { upserts } = planLimitEdit(versions, "2026-07-01", 350, "2026-08-01")
    assert.deepEqual(upserts, [
      { monthStart: "2026-07-01", amountLimit: 350 },
      { monthStart: "2026-08-01", amountLimit: 300 },
    ])
  })

  it("does not overwrite an explicit next-month version when editing past", () => {
    const versions = [
      { monthStart: "2026-01-01", amountLimit: 300 },
      { monthStart: "2026-08-01", amountLimit: 300 },
    ]
    const { upserts } = planLimitEdit(versions, "2026-07-01", 350, "2026-08-01")
    assert.deepEqual(upserts, [{ monthStart: "2026-07-01", amountLimit: 350 }])
  })

  it("only upserts current/future month", () => {
    const versions = [{ monthStart: "2026-01-01", amountLimit: 100 }]
    const { upserts } = planLimitEdit(versions, "2026-08-01", 200, "2026-08-01")
    assert.deepEqual(upserts, [{ monthStart: "2026-08-01", amountLimit: 200 }])
  })
})

describe("budget history start 2026-01-01", () => {
  it("hides budgets before January 2026 when first version is the cutoff", () => {
    const versions = [{ monthStart: "2026-01-01", amountLimit: 200 }]
    assert.equal(resolveEffectiveLimit(versions, "2025-12-01"), null)
    assert.equal(resolveEffectiveLimit(versions, "2026-01-01"), 200)
    assert.equal(resolveEffectiveLimit(versions, "2026-05-01"), 200)
  })
})

describe("paymentDayInMonth", () => {
  it("clamps 31 to last day of February", () => {
    assert.equal(paymentDayInMonth("2026-02-01", 31), 28)
  })

  it("keeps 15 in February", () => {
    assert.equal(paymentDayInMonth("2026-02-01", 15), 15)
  })
})

describe("paymentDayLabel", () => {
  it("labels overflow as último día", () => {
    assert.match(paymentDayLabel("2026-02-01", 31), /último día/)
  })
})

describe("PAN storage", () => {
  it("validates Luhn and extracts bin + last4 without storing full PAN", () => {
    const pan = "4111111111111111"
    assert.equal(isValidLuhnPan(pan), true)
    const parts = panToStoredParts(pan)
    assert.deepEqual(parts, { bin: "411111", last4: "1111" })
    assert.notEqual(parts?.bin + "******" + parts?.last4, pan)
  })

  it("rejects non-16 digit input", () => {
    assert.equal(panToStoredParts("411111"), null)
  })
})

describe("dates and money", () => {
  it("parses strict ISO dates", () => {
    assert.equal(parseIsoDateStrict("2026-08-15"), "2026-08-15")
    assert.equal(parseIsoDateStrict("2026-02-31"), null)
    assert.equal(parseIsoDateStrict("not-a-date"), null)
  })

  it("validates money amounts", () => {
    assert.equal(isValidMoneyAmount(10.5), true)
    assert.equal(isValidMoneyAmount(0), false)
    assert.equal(isValidMoneyAmount(10.555), false)
  })

  it("rounds remaining to pay", () => {
    assert.equal(remainingToPay(100, 33.333), 66.67)
    assert.equal(roundMoney(0.1 + 0.2), 0.3)
  })
})
