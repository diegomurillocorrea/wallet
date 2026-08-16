import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { sumExpenseByCategory, sumIncomeExpenseTotals } from "./spent"

describe("sumExpenseByCategory", () => {
  it("groups and rounds totals by category", () => {
    const map = sumExpenseByCategory([
      { category_id: "food", amount: 10.1 },
      { category_id: "food", amount: "0.2" },
      { category_id: "rent", amount: 500 },
      { category_id: null, amount: 99 },
    ])
    assert.equal(map.get("food"), 10.3)
    assert.equal(map.get("rent"), 500)
    assert.equal(map.has("null"), false)
  })

  it("returns an empty map for no rows", () => {
    assert.equal(sumExpenseByCategory([]).size, 0)
  })
})

describe("sumIncomeExpenseTotals", () => {
  it("splits income and expense and rounds once", () => {
    const totals = sumIncomeExpenseTotals([
      { kind: "income", amount: 100.1 },
      { kind: "expense", amount: "40.2" },
      { kind: "expense", amount: 9.8 },
    ])
    assert.equal(totals.income, 100.1)
    assert.equal(totals.expense, 50)
  })
})
